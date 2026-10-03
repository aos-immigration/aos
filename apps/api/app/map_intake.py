"""Copy a canonical intake onto the official form fields we know.

Each short name was checked against the widget tooltip on the PDF in Forms/.
The mapper only writes a field when the intake has a value for it.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any

import pikepdf

from app.pdf_access import pdf_get


def _pdf_path(slug: str) -> Path:
    return Path(__file__).resolve().parents[3] / "Forms" / f"{slug}.pdf"


def _deref(obj: Any) -> Any:
    return obj.get_object() if hasattr(obj, "get_object") else obj

MAPPED_SLUGS = ("i-130", "i-130a", "i-485")


def _person(intake: dict[str, Any], role: str) -> dict[str, Any]:
    person = intake.get(role) or {}
    return person if isinstance(person, dict) else {}


def _date(value: Any) -> str:
    if not isinstance(value, dict):
        return ""
    month = str(value.get("month") or "")
    day = str(value.get("day") or "")
    year = str(value.get("year") or "")
    if not month or not day or not year:
        return ""
    return f"{month}/{day.zfill(2)}/{year}"


def _digits(value: str) -> str:
    return "".join(ch for ch in value if ch.isdigit())


def _current_address(intake: dict[str, Any], role: str) -> dict[str, Any]:
    rows = intake.get("addresses") or []
    current = [
        row
        for row in rows
        if isinstance(row, dict)
        and row.get("personRole") == role
        and row.get("kind") == "physical"
        and row.get("isCurrent")
    ]
    return current[-1] if current else {}


def _marriage_count(intake: dict[str, Any], role: str) -> str:
    priors = [
        row
        for row in intake.get("priorMarriages") or []
        if isinstance(row, dict) and row.get("personRole") == role
    ]
    married = (intake.get("marriage") or {}).get("date")
    if not _date(married) and not priors:
        return ""
    return str(1 + len(priors))


@lru_cache(maxsize=8)
def field_index(slug: str) -> dict[str, str]:
    pdf = pikepdf.Pdf.open(str(_pdf_path(slug)))
    acro = pdf.Root.get("/AcroForm")
    if acro is None:
        return {}
    found: dict[str, str] = {}

    def walk(fields: Any, prefix: str = "") -> None:
        for field in fields:
            obj = _deref(field)
            name = str(obj.get("/T", ""))
            kids = obj.get("/Kids")
            full = f"{prefix}{name}" if name else prefix
            short = full.split(".")[-1]
            if short and short not in found:
                found[short] = full
            if kids:
                walk(kids, full + ".")

    walk(pdf_get(acro, "/Fields", []))
    return found


class MappedForm:
    def __init__(self, slug: str) -> None:
        self.index = field_index(slug)
        self.fields: dict[str, str] = {}
        self.checkboxes: dict[str, bool] = {}

    def text(self, short: str, value: str) -> None:
        if not value:
            return
        full = self.index.get(short)
        if full is None:
            raise KeyError(f"{short} is not a field on this form")
        self.fields[full] = value

    def box(self, short: str) -> None:
        full = self.index.get(short)
        if full is None:
            raise KeyError(f"{short} is not a field on this form")
        self.checkboxes[full] = True

    def payload(self) -> dict[str, Any]:
        return {"fields": self.fields, "checkboxes": self.checkboxes}


def _address_text(form: MappedForm, prefix: str, address: dict[str, Any]) -> None:
    form.text(f"{prefix}_StreetNumberName[0]", str(address.get("street") or ""))
    form.text(f"{prefix}_CityOrTown[0]", str(address.get("city") or ""))
    form.text(f"{prefix}_State[0]", str(address.get("state") or ""))
    postal = str(address.get("postal") or "")
    form.text(f"{prefix}_ZipCode[0]", postal)
    form.text(f"{prefix}_PostalCode[0]", postal)
    form.text(f"{prefix}_Country[0]", str(address.get("country") or ""))


def _map_i130(intake: dict[str, Any]) -> MappedForm:
    form = MappedForm("i-130")
    petitioner = _person(intake, "petitioner")
    beneficiary = _person(intake, "beneficiary")
    marriage = intake.get("marriage") or {}
    form.box("Pt1Line1_Spouse[0]")
    form.text("Pt2Line4a_FamilyName[0]", str(petitioner.get("familyName") or ""))
    form.text("Pt2Line4b_GivenName[0]", str(petitioner.get("givenName") or ""))
    form.text("Pt2Line4c_MiddleName[0]", str(petitioner.get("middleName") or ""))
    form.text("Pt2Line1_AlienNumber[0]", _digits(str(petitioner.get("aNumber") or "")))
    form.text("Pt2Line11_SSN[0]", str(petitioner.get("ssn") or ""))
    form.text("Pt2Line8_DateofBirth[0]", _date(petitioner.get("dateOfBirth")))
    form.text("Pt2Line6_CityTownOfBirth[0]", str(petitioner.get("birthCity") or ""))
    form.text("Pt2Line7_CountryofBirth[0]", str(petitioner.get("birthCountry") or ""))
    if petitioner.get("sex") == "male":
        form.box("Pt2Line9_Male[0]")
    elif petitioner.get("sex") == "female":
        form.box("Pt2Line9_Female[0]")
    if petitioner.get("citizenship") == "us_citizen":
        form.box("Pt2Line36_USCitizen[0]")
    elif petitioner.get("citizenship") == "lpr":
        form.box("Pt2Line36_LPR[0]")
    petitioner_address = _current_address(intake, "petitioner")
    if petitioner_address:
        _address_text(form, "Pt2Line10", petitioner_address)
        form.box("Pt2Line11_Yes[0]")
    form.text("Pt2Line16_NumberofMarriages[0]", _marriage_count(intake, "petitioner"))
    form.text("Pt2Line18_DateOfMarriage[0]", _date(marriage.get("date")))
    form.text("Pt4Line4a_FamilyName[0]", str(beneficiary.get("familyName") or ""))
    form.text("Pt4Line4b_GivenName[0]", str(beneficiary.get("givenName") or ""))
    form.text("Pt4Line4c_MiddleName[0]", str(beneficiary.get("middleName") or ""))
    form.text("Pt4Line1_AlienNumber[0]", _digits(str(beneficiary.get("aNumber") or "")))
    form.text("Pt4Line3_SSN[0]", str(beneficiary.get("ssn") or ""))
    form.text("Pt4Line9_DateOfBirth[0]", _date(beneficiary.get("dateOfBirth")))
    form.text("Pt4Line16_EmailAddress[0]", str(beneficiary.get("email") or ""))
    if beneficiary.get("sex") == "male":
        form.box("Pt4Line9_Male[0]")
    elif beneficiary.get("sex") == "female":
        form.box("Pt4Line9_Female[0]")
    beneficiary_address = _current_address(intake, "beneficiary")
    if beneficiary_address:
        _address_text(form, "Pt4Line11", beneficiary_address)
        form.text("Pt4Line12a_StreetNumberName[0]", "SAME")
    form.text("Pt4Line19_DateOfMarriage[0]", _date(marriage.get("date")))
    return form


def _parent(intake: dict[str, Any], role: str, which: str) -> dict[str, Any]:
    for row in intake.get("parents") or []:
        if isinstance(row, dict) and row.get("personRole") == role and row.get("which") == which:
            return row
    return {}


def _map_i130a(intake: dict[str, Any]) -> MappedForm:
    form = MappedForm("i-130a")
    beneficiary = _person(intake, "beneficiary")
    form.text("Pt1Line3a_FamilyName[0]", str(beneficiary.get("familyName") or ""))
    form.text("Pt1Line3b_GivenName[0]", str(beneficiary.get("givenName") or ""))
    form.text("Pt1Line3c_MiddleName[0]", str(beneficiary.get("middleName") or ""))
    form.text("Pt1Line1_AlienNumber[0]", _digits(str(beneficiary.get("aNumber") or "")))
    address = _current_address(intake, "beneficiary")
    if address:
        form.text("Pt1Line4a_StreetNumberName[0]", str(address.get("street") or ""))
        form.text("Pt1Line4c_CityOrTown[0]", str(address.get("city") or ""))
    mother = _parent(intake, "beneficiary", "mother")
    father = _parent(intake, "beneficiary", "father")
    form.text("Pt1Line10_FamilyName[0]", str(mother.get("familyName") or ""))
    form.text("Pt1Line10_GivenName[0]", str(mother.get("givenName") or ""))
    form.text("Pt1Line13_CountryofBirth[0]", str(mother.get("birthCountry") or ""))
    form.text("Pt1Line16_FamilyName[0]", str(father.get("familyName") or ""))
    form.text("Pt1Line16_GivenName[0]", str(father.get("givenName") or ""))
    form.text("Pt1Line19_CountryofBirth[0]", str(father.get("birthCountry") or ""))
    return form


_EYE = {
    "blue": "Pt7Line5_Eyecolor[0]",
    "black": "Pt7Line5_Eyecolor[1]",
    "brown": "Pt7Line5_Eyecolor[2]",
    "gray": "Pt7Line5_Eyecolor[3]",
    "grey": "Pt7Line5_Eyecolor[3]",
    "green": "Pt7Line5_Eyecolor[4]",
    "hazel": "Pt7Line5_Eyecolor[5]",
    "maroon": "Pt7Line5_Eyecolor[6]",
    "pink": "Pt7Line5_Eyecolor[7]",
}
_HAIR = {
    "bald": "Pt7Line6_Haircolor[0]",
    "black": "Pt7Line6_Haircolor[1]",
    "blond": "Pt7Line6_Haircolor[2]",
    "blonde": "Pt7Line6_Haircolor[2]",
    "brown": "Pt7Line6_Haircolor[3]",
    "gray": "Pt7Line6_Haircolor[4]",
    "grey": "Pt7Line6_Haircolor[4]",
    "red": "Pt7Line6_Haircolor[5]",
    "sandy": "Pt7Line6_Haircolor[6]",
    "white": "Pt7Line6_Haircolor[7]",
}
_RACE = {
    "asian": "Pt7Line2_Race[0]",
    "white": "Pt7Line2_Race[1]",
    "black": "Pt7Line2_Race[2]",
    "native": "Pt7Line2_Race[3]",
    "pacific": "Pt7Line2_Race[4]",
}


def _map_i485(intake: dict[str, Any]) -> MappedForm:
    form = MappedForm("i-485")
    beneficiary = _person(intake, "beneficiary")
    immigration = intake.get("immigration") or {}
    bio = ((intake.get("biographics") or {}).get("beneficiary")) or {}
    form.text("Pt1Line1_FamilyName[0]", str(beneficiary.get("familyName") or ""))
    form.text("Pt1Line1_GivenName[0]", str(beneficiary.get("givenName") or ""))
    form.text("Pt1Line1_MiddleName[0]", str(beneficiary.get("middleName") or ""))
    form.text("Pt1Line3_DOB[0]", _date(beneficiary.get("dateOfBirth")))
    form.text("Pt1Line4_AlienNumber[0]", _digits(str(beneficiary.get("aNumber") or "")))
    form.text("Pt1Line19_SSN[0]", str(beneficiary.get("ssn") or ""))
    if beneficiary.get("sex") == "female":
        form.box("Pt1Line6_CB_Sex[0]")
    elif beneficiary.get("sex") == "male":
        form.box("Pt1Line6_CB_Sex[1]")
    form.text("Pt1Line10_PassportNum[0]", str(immigration.get("passportNumber") or ""))
    form.text("P1Line12_I94[0]", str(immigration.get("i94Number") or ""))
    address = _current_address(intake, "beneficiary")
    if address:
        form.text("Pt1Line18_CurrentStreetNumberName[0]", str(address.get("street") or ""))
        form.text("Pt1Line18_CurrentCityOrTown[0]", str(address.get("city") or ""))
    if bio.get("ethnicity") == "hispanic":
        form.box("Pt7Line1_Ethnicity[0]")
    elif bio.get("ethnicity") == "not_hispanic":
        form.box("Pt7Line1_Ethnicity[1]")
    for race in bio.get("race") or []:
        short = _RACE.get(str(race))
        if short:
            form.box(short)
    eye = _EYE.get(str(bio.get("eye") or "").strip().lower())
    hair = _HAIR.get(str(bio.get("hair") or "").strip().lower())
    if eye:
        form.box(eye)
    if hair:
        form.box(hair)
    weight = _digits(str(bio.get("weightPounds") or ""))
    if len(weight) == 3:
        form.text("Pt7Line4_Weight1[0]", weight[0])
        form.text("Pt7Line4_Weight2[0]", weight[1])
        form.text("Pt7Line4_Weight3[0]", weight[2])
    return form


_MAPPERS = {
    "i-130": _map_i130,
    "i-130a": _map_i130a,
    "i-485": _map_i485,
}


def map_intake(slug: str, intake: dict[str, Any]) -> dict[str, Any]:
    mapper = _MAPPERS.get(slug)
    if mapper is None:
        raise KeyError(f"{slug} is not mapped")
    if not _pdf_path(slug).exists():
        raise FileNotFoundError(f"Forms/{slug}.pdf is not in this checkout")
    return mapper(intake).payload()
