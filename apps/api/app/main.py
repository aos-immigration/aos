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
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field

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

def _allowed_origins() -> List[str]:
    raw = os.environ.get("PDF_ALLOWED_ORIGINS", "http://localhost:3000")
    origins = [part.strip() for part in raw.split(",") if part.strip() and part.strip() != "*"]
    return origins or ["http://localhost:3000"]


app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "X-Fill-Secret"],
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
    base = Path(__file__).resolve().parents[3]
    return base / "Forms" / f"{slug}.pdf"


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


_SLUG = re.compile(r"[a-z0-9-]+")


_fill_hits: Dict[str, List[float]] = {}


def _rate_ok(request: Request) -> bool:
    try:
        limit = int(os.environ.get("PDF_RATE_LIMIT", "60"))
    except ValueError:
        limit = 60
    now = time.time()
    forwarded = request.headers.get("x-forwarded-for", "")
    client = request.client.host if request.client else "local"
    ip = forwarded.split(",")[0].strip() if forwarded else client
    stamps = [stamp for stamp in _fill_hits.get(ip, []) if now - stamp < 60]
    if len(stamps) >= limit:
        _fill_hits[ip] = stamps
        return False
    stamps.append(now)
    _fill_hits[ip] = stamps
    return True


def _fill_caller_authorized(request: Request) -> bool:
    """Shared secret from the signed-in Next.js route. Fail closed when unset."""
    expected = os.environ.get("PDF_FILL_SECRET", "")
    provided = request.headers.get("x-fill-secret", "")
    if not expected or not provided:
        return False
    return hmac.compare_digest(
        hashlib.sha256(provided.encode()).digest(),
        hashlib.sha256(expected.encode()).digest(),
    )


@app.post("/fill/{slug}")
async def fill_pdf(slug: str, request: Request):
    if not _fill_caller_authorized(request):
        raise HTTPException(status_code=401, detail="Unauthorized")
    if not _rate_ok(request):
        raise HTTPException(status_code=429, detail="Too many requests")
    if not _SLUG.fullmatch(slug):
        raise HTTPException(status_code=404, detail=PDF_NOT_FOUND)
    raw = await request.body()
    try:
        max_bytes = int(os.environ.get("PDF_MAX_BODY_BYTES", "1000000"))
    except ValueError:
        max_bytes = 1_000_000
    if len(raw) > max_bytes:
        raise HTTPException(status_code=413, detail="Request too large")
    try:
        payload = FillRequest.model_validate_json(raw)
    except Exception:
        raise HTTPException(status_code=422, detail="Invalid fill request") from None
    pdf_file = _pdf_path(slug)
    if not pdf_file.exists():
        raise HTTPException(status_code=404, detail=PDF_NOT_FOUND)
    pdf = pikepdf.Pdf.open(str(pdf_file))
    acro = pdf.Root.get(ACROFORM_KEY, None)
    if not acro:
        raise HTTPException(status_code=400, detail="PDF has no AcroForm")

    acro["/NeedAppearances"] = pikepdf.Boolean(True)

    field_values: Dict[str, str] = dict(payload.fields)
    checkbox_values: Dict[str, bool] = dict(payload.checkboxes)

    _walk_fields(pdf_get(acro, FIELDS_KEY, []), field_values, checkbox_values)

    output = BytesIO()
    pdf.save(output)
    output.seek(0)

    filename = f"{slug}-filled.pdf"
    return StreamingResponse(
        output,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
