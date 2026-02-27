"""
PDF Fill Eval Script for i-130

Verifies that HTML form data correctly maps to PDF fields by filling a PDF
and reading back the field values.

Usage:
    # Direct mode (default) — fills PDF in-memory via pikepdf
    python scripts/eval_fill.py fixtures/basic_petitioner.json
    python scripts/eval_fill.py fixtures/   # run all fixtures in directory

    # HTTP mode — sends payload to running API
    python scripts/eval_fill.py fixtures/basic_petitioner.json --http
    python scripts/eval_fill.py fixtures/ --http --base-url http://localhost:8000
"""
from __future__ import annotations

import argparse
import json
import sys
from io import BytesIO
from pathlib import Path
from typing import Any, Dict, List, Tuple

import pikepdf

# ---------------------------------------------------------------------------
# Resolve paths
# ---------------------------------------------------------------------------
SCRIPT_DIR = Path(__file__).resolve().parent
API_DIR = SCRIPT_DIR.parent
ROOT_DIR = API_DIR.parents[1]
FORMS_DIR = ROOT_DIR / "Forms"

# Add apps/api to sys.path so we can import from app.main
sys.path.insert(0, str(API_DIR))

from app.main import _deref, _walk_fields  # noqa: E402

# ---------------------------------------------------------------------------
# ANSI colours
# ---------------------------------------------------------------------------
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BOLD = "\033[1m"
RESET = "\033[0m"


def _read_field_values(pdf_bytes: bytes) -> Dict[str, str]:
    """Read all field values from a filled PDF, returning {field_name: value}."""
    pdf = pikepdf.Pdf.open(BytesIO(pdf_bytes))
    acro = pdf.Root.get("/AcroForm", None)
    if not acro:
        return {}
    results: Dict[str, str] = {}

    def walk(arr: Any, prefix: str = "") -> None:
        for f in arr:
            obj = _deref(f)
            name = obj.get("/T", "")
            kids = obj.get("/Kids", None)
            full = f"{prefix}{name}" if name else prefix
            if kids:
                walk(kids, prefix=full + ".")
            else:
                val = obj.get("/V", None)
                if val is None:
                    results[full] = ""
                elif isinstance(val, pikepdf.Name):
                    results[full] = str(val)  # e.g. "/Yes", "/Off"
                elif isinstance(val, pikepdf.String):
                    results[full] = str(val)
                else:
                    results[full] = str(val)

    walk(acro.get("/Fields", []))
    return results


def _fill_direct(slug: str, fields: Dict[str, str], checkboxes: Dict[str, bool]) -> bytes:
    """Fill PDF in-memory using pikepdf (same logic as the API)."""
    pdf_path = FORMS_DIR / f"{slug}.pdf"
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")
    pdf = pikepdf.Pdf.open(str(pdf_path))
    acro = pdf.Root.get("/AcroForm", None)
    if not acro:
        raise RuntimeError("PDF has no AcroForm")
    acro["/NeedAppearances"] = pikepdf.Boolean(True)
    _walk_fields(acro.get("/Fields", []), fields, checkboxes)
    buf = BytesIO()
    pdf.save(buf)
    return buf.getvalue()


def _fill_http(slug: str, fields: Dict[str, str], checkboxes: Dict[str, bool],
               base_url: str) -> bytes:
    """Fill PDF via the running API and return the PDF bytes."""
    import urllib.request
    url = f"{base_url}/fill/{slug}"
    payload = json.dumps({"fields": fields, "checkboxes": checkboxes}).encode()
    req = urllib.request.Request(url, data=payload,
                                headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.read()
    except Exception as exc:
        raise RuntimeError(f"HTTP fill failed: {exc}") from exc


# ---------------------------------------------------------------------------
# Comparison
# ---------------------------------------------------------------------------

def _compare(actual: Dict[str, str], expected: Dict[str, str]) -> List[Tuple[str, str, str, bool]]:
    """Compare actual vs expected field values.

    Returns list of (field_name, expected_value, actual_value, passed).
    """
    results: List[Tuple[str, str, str, bool]] = []
    for field_name, exp_val in sorted(expected.items()):
        act_val = actual.get(field_name, "")
        # Normalize pikepdf Name values — strip leading /
        act_clean = act_val.lstrip("/") if act_val.startswith("/") else act_val
        exp_clean = exp_val.lstrip("/") if exp_val.startswith("/") else exp_val
        passed = act_clean == exp_clean
        results.append((field_name, exp_val, act_val, passed))
    return results


def _print_report(fixture_name: str, results: List[Tuple[str, str, str, bool]]) -> bool:
    """Print a coloured pass/fail report. Returns True if all passed."""
    passed_count = sum(1 for *_, p in results if p)
    failed_count = len(results) - passed_count
    all_passed = failed_count == 0

    status = f"{GREEN}PASS{RESET}" if all_passed else f"{RED}FAIL{RESET}"
    print(f"\n{BOLD}━━━ {fixture_name} ━━━{RESET}  [{status}]  "
          f"({passed_count}/{len(results)} fields)")

    for field_name, exp_val, act_val, ok in results:
        if ok:
            print(f"  {GREEN}✓{RESET} {field_name}: {exp_val}")
        else:
            print(f"  {RED}✗{RESET} {field_name}")
            print(f"      expected: {YELLOW}{exp_val}{RESET}")
            print(f"      actual:   {RED}{act_val}{RESET}")

    return all_passed


# ---------------------------------------------------------------------------
# Fixture loading & running
# ---------------------------------------------------------------------------

def _load_fixture(path: Path) -> Dict[str, Any]:
    """Load and validate a fixture JSON file.

    Supports two formats:
      1. Flat: {fields: {...}, checkboxes: {...}, expected_values: {...}}
      2. Wrapped: {payload: {fields: {...}, checkboxes: {...}}, expected_values: {...}}
    """
    data = json.loads(path.read_text())
    if "expected_values" not in data:
        raise ValueError(f"Fixture {path.name} missing 'expected_values' key")
    # Unwrap payload if present
    if "payload" in data:
        payload = data["payload"]
        data.setdefault("fields", payload.get("fields", {}))
        data.setdefault("checkboxes", payload.get("checkboxes", {}))
    else:
        data.setdefault("fields", {})
        data.setdefault("checkboxes", {})
    data.setdefault("slug", "i-130")
    return data


def _run_fixture(path: Path, *, http: bool = False, base_url: str = "http://localhost:8000") -> bool:
    """Run a single fixture. Returns True if all fields pass."""
    data = _load_fixture(path)
    slug = data["slug"]
    fields = data["fields"]
    checkboxes = data["checkboxes"]
    expected = data["expected_values"]

    if http:
        pdf_bytes = _fill_http(slug, fields, checkboxes, base_url)
    else:
        pdf_bytes = _fill_direct(slug, fields, checkboxes)

    actual = _read_field_values(pdf_bytes)
    results = _compare(actual, expected)
    return _print_report(path.name, results)


def _collect_fixtures(target: Path) -> List[Path]:
    """Collect fixture JSON files from a file or directory."""
    if target.is_file():
        return [target]
    if target.is_dir():
        files = sorted(target.glob("*.json"))
        if not files:
            print(f"{YELLOW}Warning: No .json fixtures found in {target}{RESET}")
        return files
    raise FileNotFoundError(f"Not found: {target}")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Evaluate i-130 PDF fill accuracy against fixture expectations")
    parser.add_argument("target", type=Path,
                        help="Path to fixture JSON file or directory of fixtures")
    parser.add_argument("--http", action="store_true",
                        help="Use HTTP API instead of direct pikepdf fill")
    parser.add_argument("--base-url", default="http://localhost:8000",
                        help="Base URL for HTTP mode (default: http://localhost:8000)")
    args = parser.parse_args()

    fixtures = _collect_fixtures(args.target)
    if not fixtures:
        print(f"{RED}No fixtures to run.{RESET}")
        sys.exit(1)

    all_passed = True
    for fixture_path in fixtures:
        try:
            if not _run_fixture(fixture_path, http=args.http, base_url=args.base_url):
                all_passed = False
        except Exception as exc:
            print(f"\n{RED}ERROR{RESET} processing {fixture_path.name}: {exc}")
            all_passed = False

    # Summary
    total = len(fixtures)
    print(f"\n{BOLD}{'=' * 50}{RESET}")
    if all_passed:
        print(f"{GREEN}All {total} fixture(s) passed!{RESET}")
    else:
        print(f"{RED}Some fixtures failed.{RESET}")
    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()

