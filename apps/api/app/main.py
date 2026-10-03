from __future__ import annotations

import hashlib
import hmac
import json
import logging
import os
import re
import time
import threading
import urllib.request
from io import BytesIO
from pathlib import Path
from typing import Any, Dict, List, Optional

import pikepdf
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field

from app.http_policy import (
    FORMS_DIR,
    form_pdf,
    parse_allowed_origins,
    validation_errors_for_client,
)
from app.pdf_access import pdf_get

DD_API_KEY = os.environ.get("DD_API_KEY", "")
DD_SITE = os.environ.get("DD_SITE", "us5.datadoghq.com")
DD_SERVICE = os.environ.get("DD_SERVICE", "aos-api")
DD_ENV = os.environ.get("DD_ENV", "development")

logger = logging.getLogger("aos-api")
logger.setLevel(logging.INFO)


def _send_dd_log(
    message: str,
    status: str = "info",
    extra: dict[str, object] | None = None,
) -> None:
    if not DD_API_KEY:
        return
    payload: dict[str, object] = {
        "message": message,
        "ddsource": "python",
        "service": DD_SERVICE,
        "hostname": os.environ.get("HOSTNAME", "cloudtop-dev"),
        "ddtags": f"env:{DD_ENV},version:0.1.0",
        "status": status,
    }
    if extra:
        payload.update(extra)

    def _post():
        try:
            data = json.dumps([payload]).encode()
            req = urllib.request.Request(
                f"https://http-intake.logs.{DD_SITE}/api/v2/logs",
                data=data,
                headers={
                    "DD-API-KEY": DD_API_KEY,
                    "Content-Type": "application/json",
                },
            )
            urllib.request.urlopen(req, timeout=5)
        except Exception:
            pass

    threading.Thread(target=_post, daemon=True).start()


app = FastAPI(title="AOS PDF Service")

ACROFORM_KEY = "/AcroForm"
FIELDS_KEY = "/Fields"
PDF_NOT_FOUND = "PDF not found"
DEV_FILL_SECRET = "dev-only-fill-secret"

app.add_middleware(
    CORSMiddleware,
    allow_origins=parse_allowed_origins(os.environ.get("ALLOWED_ORIGINS")),
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Fill-Secret", "X-Fill-Caller"],
)


@app.exception_handler(RequestValidationError)
async def hide_validation_input(
    _request: Request, exc: RequestValidationError
) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={"detail": validation_errors_for_client(exc.errors())},
    )


@app.middleware("http")
async def datadog_logging_middleware(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration_ms = (time.time() - start) * 1000
    status = "error" if response.status_code >= 400 else "info"
    _send_dd_log(
        f"{request.method} {request.url.path} → {response.status_code} in {duration_ms:.0f}ms",
        status=status,
        extra={
            "http.method": request.method,
            "http.path": request.url.path,
            "http.status_code": response.status_code,
            "duration_ms": round(duration_ms, 2),
        },
    )
    return response


class FillRequest(BaseModel):
    fields: Dict[str, str] = Field(default_factory=dict)
    checkboxes: Dict[str, bool] = Field(default_factory=dict)


def _pdf_path(slug: str) -> Path:
    path = form_pdf(slug, FORMS_DIR)
    if path is None:
        raise HTTPException(status_code=404, detail=PDF_NOT_FOUND)
    return path


def _deref(obj):
    return obj.get_object() if hasattr(obj, "get_object") else obj


KIDS_KEY = "/Kids"
PARENT_KEY = "/Parent"


def _list_fields(pdf_file: Path) -> List[Dict[str, str]]:
    pdf = pikepdf.Pdf.open(str(pdf_file))
    acro = pdf.Root.get(ACROFORM_KEY, None)
    if not acro:
        return []
    fields = pdf_get(acro, FIELDS_KEY, [])
    results: List[Dict[str, str]] = []

    def walk(arr, prefix: str = ""):
        for f in arr:
            obj = _deref(f)
            name = obj.get("/T", "")
            field_type = obj.get("/FT", "")
            kids = obj.get(KIDS_KEY, None)
            full = f"{prefix}{name}" if name else prefix
            if kids:
                walk(kids, prefix=full + ".")
            else:
                results.append(
                    {
                        "name": full,
                        "type": str(field_type),
                    }
                )

    walk(fields)
    return results


def _checkbox_on_value(obj) -> pikepdf.Name:
    """Return the widget's real "on" appearance state, sniffed from /AP.

    Checkbox on-states vary per form (/Y, /N, /1, /Yes, ...). Setting /V
    to a name that is not a key of the appearance dictionary leaves the
    box visually unchecked in every viewer, so /AP is the ground truth.
    """
    ap = obj.get("/AP")
    if ap is None:
        parent = obj.get("/Parent")
        if parent is not None:
            ap = _deref(parent).get("/AP")
    if ap is not None:
        ap = _deref(ap)
        for state_key in ("/D", "/N"):
            states = ap.get(state_key) if hasattr(ap, "get") else None
            if states is None:
                continue
            states = _deref(states)
            if hasattr(states, "keys"):
                for key in states.keys():
                    if str(key) != "/Off":
                        return pikepdf.Name(str(key))
    return pikepdf.Name("/Yes")


def _ap_debug(ap):
    info: dict[str, Any] = {
        "ap_type": str(type(ap)),
    }
    ap = _deref(ap)
    info["ap_deref_type"] = str(type(ap))
    info["ap_str"] = str(ap)
    normal = ap.get("/N") if hasattr(ap, "get") else None
    if normal is None:
        return info
    normal = _deref(normal)
    info["ap_normal_type"] = str(type(normal))
    info["ap_normal_str"] = str(normal)
    if hasattr(normal, "keys"):
        info["ap_states"] = [str(k) for k in normal.keys()]
    else:
        info["ap_states"] = [str(k) for k in getattr(ap, "keys", [])]
    return info


def _field_debug(obj):
    info: dict[str, Any] = {
        "type": str(obj.get("/FT", "")),
        "value": str(obj.get("/V", "")),
        "as": str(obj.get("/AS", "")),
        "ff": str(obj.get("/Ff", "")),
        "keys": [str(k) for k in obj.keys()],
    }
    ap = obj.get("/AP")
    if ap:
        info.update(_ap_debug(ap))
    parent = obj.get(PARENT_KEY)
    if parent:
        parent_obj = _deref(parent)
        info["parent_keys"] = [str(k) for k in parent_obj.keys()]
        parent_ap = parent_obj.get("/AP")
        if parent_ap:
            info["parent_ap"] = _ap_debug(parent_ap)
    kids = obj.get(KIDS_KEY)
    if kids:
        info["kids"] = [_field_debug(_deref(kid)) for kid in kids]
    return info


def _apply_checkbox_group(obj, kids, checked: bool) -> None:
    value = _checkbox_on_value(_deref(kids[0])) if kids else pikepdf.Name("/Yes")
    target = value if checked else pikepdf.Name("/Off")
    obj["/V"] = target
    for kid in kids:
        kid_obj = _deref(kid)
        kid_obj["/AS"] = target if checked else pikepdf.Name("/Off")


def _apply_leaf_value(
    obj, full: str, field_values: Dict[str, str], checkbox_values: Dict[str, bool]
) -> None:
    text_value = field_values.get(full)
    if text_value is not None:
        obj["/V"] = pikepdf.String(text_value)
    checkbox_value = checkbox_values.get(full)
    if checkbox_value is None:
        return
    value = _checkbox_on_value(obj) if checkbox_value else pikepdf.Name("/Off")
    obj["/V"] = value
    obj["/AS"] = value
    parent = obj.get(PARENT_KEY)
    if not parent:
        return
    parent_obj = _deref(parent)
    if str(parent_obj.get("/FT", "")) != "/Btn":
        return
    parent_obj["/V"] = value
    kids = parent_obj.get(KIDS_KEY, None)
    if not kids:
        return
    for kid in kids:
        kid_obj = _deref(kid)
        if kid_obj == obj:
            kid_obj["/AS"] = value if checkbox_value else pikepdf.Name("/Off")
        else:
            kid_obj["/AS"] = pikepdf.Name("/Off")


def _walk_fields(
    fields, field_values: Dict[str, str], checkbox_values: Dict[str, bool]
) -> None:
    stack = [(fields, "")]
    while stack:
        arr, prefix = stack.pop()
        for f in arr:
            obj = _deref(f)
            name = obj.get("/T", "")
            kids = obj.get(KIDS_KEY, None)
            full = f"{prefix}{name}" if name else prefix
            if kids:
                if full in checkbox_values:
                    _apply_checkbox_group(obj, kids, checkbox_values[full])
                    continue
                stack.append((kids, full + "."))
                continue
            _apply_leaf_value(obj, full, field_values, checkbox_values)


@app.get("/health")
def health():
    return {"ok": True}


def _catalog_enabled() -> bool:
    if os.environ.get("PDF_ALLOW_DEBUG") == "1":
        return True
    return os.environ.get("PDF_SERVICE_ENV", "development") != "production"


@app.get("/fields/{slug}")
def list_fields(slug: str):
    if not _catalog_enabled():
        raise HTTPException(status_code=404, detail=PDF_NOT_FOUND)
    pdf_file = _pdf_path(slug)
    if not pdf_file.exists():
        raise HTTPException(status_code=404, detail=PDF_NOT_FOUND)
    return JSONResponse({"fields": _list_fields(pdf_file)})


@app.get("/debug/field/{slug}")
def debug_field(slug: str, name: str):
    if not _catalog_enabled():
        raise HTTPException(status_code=404, detail=PDF_NOT_FOUND)
    pdf_file = _pdf_path(slug)
    if not pdf_file.exists():
        raise HTTPException(status_code=404, detail=PDF_NOT_FOUND)
    pdf = pikepdf.Pdf.open(str(pdf_file))
    acro = pdf.Root.get(ACROFORM_KEY, None)
    if not acro:
        raise HTTPException(status_code=400, detail="PDF has no AcroForm")
    stack = [(pdf_get(acro, FIELDS_KEY, []), "")]
    while stack:
        arr, prefix = stack.pop()
        for f in arr:
            obj = _deref(f)
            field_name = obj.get("/T", "")
            kids = obj.get(KIDS_KEY, None)
            full = f"{prefix}{field_name}" if field_name else prefix
            if full == name:
                return JSONResponse({"name": full, "info": _field_debug(obj)})
            if kids:
                stack.append((kids, full + "."))
    raise HTTPException(status_code=404, detail="Field name not found")


_fill_hits: Dict[str, List[float]] = {}
_CALLER_KEY = re.compile(r"^[A-Za-z0-9_-]{1,128}$")


def _rate_key(request: Request) -> str:
    """The web server names the caller. A client-supplied forwarding header is not a key."""
    caller = request.headers.get("x-fill-caller", "").strip()
    if _CALLER_KEY.fullmatch(caller):
        return caller
    return "missing"


def _rate_ok(request: Request) -> bool:
    try:
        limit = int(os.environ.get("PDF_RATE_LIMIT", "60"))
    except ValueError:
        limit = 60
    now = time.time()
    key = _rate_key(request)
    stamps = [stamp for stamp in _fill_hits.get(key, []) if now - stamp < 60]
    if len(stamps) >= limit:
        _fill_hits[key] = stamps
        return False
    stamps.append(now)
    _fill_hits[key] = stamps
    return True


def _expected_fill_secret() -> str:
    """Local dev uses a fixed secret. Production must set PDF_FILL_SECRET."""
    explicit = os.environ.get("PDF_FILL_SECRET", "")
    if explicit:
        return explicit
    if os.environ.get("PDF_SERVICE_ENV") == "production":
        return ""
    return DEV_FILL_SECRET


def _fill_caller_authorized(request: Request) -> bool:
    """Shared secret from the Next.js server. Fail closed when unset."""
    expected = _expected_fill_secret()
    provided = request.headers.get("x-fill-secret", "")
    if not expected or not provided:
        return False
    return hmac.compare_digest(
        hashlib.sha256(provided.encode()).digest(),
        hashlib.sha256(expected.encode()).digest(),
    )


def _body_limit() -> int:
    try:
        return int(os.environ.get("PDF_MAX_BODY_BYTES", "1000000"))
    except ValueError:
        return 1_000_000


async def _guarded_body(request: Request) -> bytes:
    if not _fill_caller_authorized(request):
        raise HTTPException(status_code=401, detail="Unauthorized")
    if not _rate_ok(request):
        raise HTTPException(status_code=429, detail="Too many requests")
    raw = await request.body()
    if len(raw) > _body_limit():
        raise HTTPException(status_code=413, detail="Request too large")
    return raw


class IntakeFillRequest(BaseModel):
    intake: Dict[str, Any] = Field(default_factory=dict)
    acknowledged: Optional[bool] = None


def _require_acknowledgement(body: IntakeFillRequest) -> None:
    if body.acknowledged is not True:
        raise HTTPException(
            status_code=400,
            detail="Acknowledgement is required before a PDF can be downloaded.",
        )


def _selected_forms(intake: Dict[str, Any]) -> List[str]:
    selected = intake.get("selectedForms", None)
    if not isinstance(selected, list) or len(selected) == 0:
        raise HTTPException(status_code=400, detail="selectedForms is empty")
    slugs = [slug for slug in selected if isinstance(slug, str) and slug.strip()]
    if not slugs:
        raise HTTPException(status_code=400, detail="selectedForms is empty")
    return slugs


def _filled_pdf(slug: str, fields: Dict[str, str], checkboxes: Dict[str, bool]) -> BytesIO:
    pdf_file = _pdf_path(slug)
    if not pdf_file.exists():
        raise HTTPException(status_code=404, detail=PDF_NOT_FOUND)
    pdf = pikepdf.Pdf.open(str(pdf_file))
    acro = pdf.Root.get(ACROFORM_KEY, None)
    if not acro:
        raise HTTPException(status_code=400, detail="PDF has no AcroForm")
    acro["/NeedAppearances"] = pikepdf.Boolean(True)
    _walk_fields(pdf_get(acro, FIELDS_KEY, []), fields, checkboxes)
    output = BytesIO()
    pdf.save(output)
    output.seek(0)
    return output


@app.post("/fill/{slug}")
async def fill_pdf(slug: str, request: Request):
    raw = await _guarded_body(request)
    try:
        payload = FillRequest.model_validate_json(raw)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid fill request") from None
    output = _filled_pdf(slug, dict(payload.fields), dict(payload.checkboxes))
    filename = f"{slug}-filled.pdf"
    return StreamingResponse(
        output,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store",
        },
    )


def _map_or_404(slug: str, intake: Dict[str, Any]) -> Dict[str, Any]:
    from app.map_intake import map_intake

    try:
        return map_intake(slug, intake)
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


async def _intake_request(request: Request) -> IntakeFillRequest:
    raw = await _guarded_body(request)
    try:
        return IntakeFillRequest.model_validate_json(raw)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid fill request") from None


@app.post("/fill-intake/{slug}")
async def fill_intake(slug: str, request: Request):
    body = await _intake_request(request)
    _require_acknowledgement(body)
    mapped = _map_or_404(slug, body.intake)
    output = _filled_pdf(slug, mapped["fields"], mapped["checkboxes"])
    filename = f"{slug}-filled.pdf"
    return StreamingResponse(
        output,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store",
        },
    )


@app.post("/preview-intake")
async def preview_intake(request: Request):
    body = await _intake_request(request)
    from app.map_intake import MAPPED_SLUGS

    from app.preview_pages import render_pdf_pages

    selected = _selected_forms(body.intake)
    forms: List[Dict[str, Any]] = []
    notes: List[str] = []
    for slug in selected:
        if slug not in MAPPED_SLUGS:
            notes.append(f"{slug}: not filled. This packet does not map that form yet.")
            continue
        try:
            mapped = _map_or_404(slug, body.intake)
        except HTTPException as exc:
            if exc.status_code == 404:
                notes.append(f"{slug}: not filled. The official PDF is not in this checkout.")
                continue
            raise
        pdf = _filled_pdf(slug, mapped["fields"], mapped["checkboxes"])
        forms.append(
            {
                "slug": slug,
                "title": f"Form {slug.upper()}",
                "pages": render_pdf_pages(pdf.getvalue()),
            }
        )
    return JSONResponse(
        {"forms": forms, "notes": notes},
        headers={"Cache-Control": "no-store"},
    )


@app.post("/packet")
async def packet(request: Request):
    body = await _intake_request(request)
    import io
    import zipfile

    from app.map_intake import MAPPED_SLUGS

    _require_acknowledgement(body)
    selected = _selected_forms(body.intake)
    buffer = io.BytesIO()
    notes: List[str] = [
        "These are drafts. Check every answer against the form instructions before you sign.",
        "AOS does not file these forms with USCIS.",
    ]
    with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
        for slug in selected:
            if slug not in MAPPED_SLUGS:
                notes.append(f"{slug}: not filled. This packet does not map that form yet.")
                continue
            try:
                mapped = _map_or_404(slug, body.intake)
            except HTTPException as exc:
                if exc.status_code == 404:
                    notes.append(
                        f"{slug}: not filled. The official PDF is not in this checkout."
                    )
                    continue
                raise
            pdf = _filled_pdf(slug, mapped["fields"], mapped["checkboxes"])
            archive.writestr(f"{slug}-filled.pdf", pdf.getvalue())
        archive.writestr("read-me.txt", "\n".join(notes) + "\n")
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/zip",
        headers={
            "Content-Disposition": 'attachment; filename="aos-packet.zip"',
            "Cache-Control": "no-store",
        },
    )
