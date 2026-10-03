"""Boundary helpers for pikepdf objects.

pikepdf's stubs type `.get(key, default)` as returning an Object, so a list
default does not type-check. Callers still need "missing key means this
default" at the AcroForm boundary.
"""

from typing import Any


def pdf_get(obj: Any, key: str, default: Any = None) -> Any:
    if not hasattr(obj, "get"):
        return default
    value = obj.get(key)
    if value is None:
        return default
    return value
