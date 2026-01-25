from __future__ import annotations

from io import BytesIO
from pathlib import Path
from typing import Dict, List, Optional

import pikepdf
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field

app = FastAPI(title="AOS PDF Service")

ACROFORM_KEY = "/AcroForm"
FIELDS_KEY = "/Fields"
PDF_NOT_FOUND = "PDF not found"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
    fields = acro.get(FIELDS_KEY, [])
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
    ap = obj.get("/AP")
    if not ap:
        parent = obj.get("/Parent")
        if parent:
            ap = _deref(parent).get("/AP")
    if ap:
        ap = _deref(ap)
        if isinstance(ap, dict):
            down = ap.get("/D")
            if down:
                down = _deref(down)
                if hasattr(down, "keys"):
                    for key in down.keys():
                        if str(key) != "/Off":
                            return pikepdf.Name(str(key))
            normal = ap.get("/N")
            if normal:
                normal = _deref(normal)
                if hasattr(normal, "keys"):
                    for key in normal.keys():
                        if str(key) != "/Off":
                            return pikepdf.Name(str(key))
    return pikepdf.Name("/Yes")


def _ap_debug(ap):
    info = {
        "ap_type": str(type(ap)),
    }
    ap = _deref(ap)
    info["ap_deref_type"] = str(type(ap))
    info["ap_str"] = str(ap)
    normal = ap.get("/N") if isinstance(ap, dict) else None
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
    info = {
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
    if "_Yes[0]" in full:
        value = pikepdf.Name("/Y") if checkbox_value else pikepdf.Name("/Off")
    elif "_No[0]" in full:
        value = pikepdf.Name("/N") if checkbox_value else pikepdf.Name("/Off")
    else:
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


@app.get("/fields/{slug}")
def list_fields(slug: str):
    pdf_file = _pdf_path(slug)
    if not pdf_file.exists():
        raise HTTPException(status_code=404, detail=PDF_NOT_FOUND)
    return JSONResponse({"fields": _list_fields(pdf_file)})


@app.get("/debug/field/{slug}")
def debug_field(slug: str, name: str):
    pdf_file = _pdf_path(slug)
    if not pdf_file.exists():
        raise HTTPException(status_code=404, detail=PDF_NOT_FOUND)
    pdf = pikepdf.Pdf.open(str(pdf_file))
    acro = pdf.Root.get(ACROFORM_KEY, None)
    if not acro:
        raise HTTPException(status_code=400, detail="PDF has no AcroForm")
    stack = [(acro.get(FIELDS_KEY, []), "")]
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


@app.post("/fill/{slug}")
def fill_pdf(slug: str, payload: FillRequest):
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

    _walk_fields(acro.get(FIELDS_KEY, []), field_values, checkbox_values)

    output = BytesIO()
    pdf.save(output)
    output.seek(0)

    filename = f"{slug}-filled.pdf"
    return StreamingResponse(
        output,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
