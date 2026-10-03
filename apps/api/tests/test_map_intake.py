import io
import zipfile

from fastapi.testclient import TestClient

from app.main import app
from app.map_intake import map_intake

client = TestClient(app)

DEMO = {
    "selectedForms": ["i-130", "i-130a", "i-485", "i-864", "i-765"],
    "petitioner": {
        "givenName": "Jordan",
        "middleName": "Q",
        "familyName": "Sampleton",
        "sex": "female",
        "dateOfBirth": {"month": "03", "day": "14", "year": "1990"},
        "birthCity": "Sample City",
        "birthCountry": "United States",
        "citizenship": "us_citizen",
        "aNumber": "A000000000",
        "ssn": "000-00-0000",
        "email": "jordan.sampleton@example.com",
    },
    "beneficiary": {
        "givenName": "Avery",
        "middleName": "R",
        "familyName": "Exampleton",
        "sex": "male",
        "dateOfBirth": {"month": "07", "day": "02", "year": "1992"},
        "aNumber": "A000000001",
        "ssn": "000-00-0000",
        "email": "avery.exampleton@example.com",
    },
    "marriage": {"date": {"month": "06", "day": "15", "year": "2024"}},
    "addresses": [
        {
            "personRole": "petitioner",
            "kind": "physical",
            "street": "100 Fictional Lane",
            "city": "Sample City",
            "state": "CA",
            "postal": "00000",
            "country": "United States",
            "isCurrent": True,
        },
        {
            "personRole": "beneficiary",
            "kind": "physical",
            "street": "100 Fictional Lane",
            "city": "Sample City",
            "state": "CA",
            "postal": "00000",
            "country": "United States",
            "isCurrent": True,
        },
    ],
    "parents": [
        {
            "personRole": "beneficiary",
            "which": "mother",
            "givenName": "Mina",
            "familyName": "Exampleton",
            "birthCountry": "Fictionland",
        }
    ],
    "priorMarriages": [],
    "immigration": {"i94Number": "00000000000", "passportNumber": "P0000000"},
    "biographics": {
        "beneficiary": {
            "ethnicity": "not_hispanic",
            "race": ["asian"],
            "eye": "brown",
            "hair": "black",
            "weightPounds": "150",
        }
    },
}


def _full(slug: str, short: str) -> str:
    from app.map_intake import field_index

    return field_index(slug)[short]


def test_i130_copies_both_spouses() -> None:
    mapped = map_intake("i-130", DEMO)
    fields = mapped["fields"]
    assert fields[_full("i-130", "Pt2Line4a_FamilyName[0]")] == "Sampleton"
    assert fields[_full("i-130", "Pt4Line4a_FamilyName[0]")] == "Exampleton"
    assert fields[_full("i-130", "Pt2Line8_DateofBirth[0]")] == "03/14/1990"
    assert fields[_full("i-130", "Pt4Line12a_StreetNumberName[0]")] == "SAME"
    assert mapped["checkboxes"][_full("i-130", "Pt1Line1_Spouse[0]")] is True
    assert mapped["checkboxes"][_full("i-130", "Pt2Line36_USCitizen[0]")] is True


def test_i130a_copies_the_spouse_and_a_parent() -> None:
    fields = map_intake("i-130a", DEMO)["fields"]
    assert fields[_full("i-130a", "Pt1Line3a_FamilyName[0]")] == "Exampleton"
    assert fields[_full("i-130a", "Pt1Line4a_StreetNumberName[0]")] == "100 Fictional Lane"
    assert fields[_full("i-130a", "Pt1Line10_FamilyName[0]")] == "Exampleton"
    assert fields[_full("i-130a", "Pt1Line13_CountryofBirth[0]")] == "Fictionland"


def test_i485_copies_the_applicant() -> None:
    mapped = map_intake("i-485", DEMO)
    fields = mapped["fields"]
    assert fields[_full("i-485", "Pt1Line1_FamilyName[0]")] == "Exampleton"
    assert fields[_full("i-485", "Pt1Line3_DOB[0]")] == "07/02/1992"
    assert fields[_full("i-485", "P1Line12_I94[0]")] == "00000000000"
    assert fields[_full("i-485", "Pt7Line4_Weight1[0]")] == "1"
    assert mapped["checkboxes"][_full("i-485", "Pt1Line6_CB_Sex[1]")] is True
    assert mapped["checkboxes"][_full("i-485", "Pt7Line5_Eyecolor[2]")] is True


def test_fill_intake_returns_a_pdf() -> None:
    response = client.post(
        "/fill-intake/i-130", json={"intake": DEMO, "acknowledged": True}
    )
    assert response.status_code == 200
    assert response.content.startswith(b"%PDF")
    assert response.headers["cache-control"] == "no-store"


def test_fill_intake_rejects_a_missing_acknowledgement() -> None:
    response = client.post("/fill-intake/i-130", json={"intake": DEMO})
    assert response.status_code == 400
    assert not response.content.startswith(b"%PDF")


def test_packet_includes_mapped_forms_and_names_the_gap() -> None:
    response = client.post("/packet", json={"intake": DEMO, "acknowledged": True})
    assert response.status_code == 200
    archive = zipfile.ZipFile(io.BytesIO(response.content))
    names = set(archive.namelist())
    assert names == {
        "i-130-filled.pdf",
        "i-130a-filled.pdf",
        "i-485-filled.pdf",
        "read-me.txt",
    }
    note = archive.read("read-me.txt").decode()
    assert "i-864" in note
    assert "i-765" in note
    assert "does not file" in note


def test_packet_rejects_an_empty_selection() -> None:
    empty = {**DEMO, "selectedForms": []}
    response = client.post("/packet", json={"intake": empty, "acknowledged": True})
    assert response.status_code == 400


def test_packet_rejects_a_missing_acknowledgement() -> None:
    response = client.post("/packet", json={"intake": DEMO})
    assert response.status_code == 400
    assert response.headers["content-type"].startswith("application/json")


def test_preview_returns_images_without_acknowledgement() -> None:
    import base64

    response = client.post("/preview-intake", json={"intake": DEMO})
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/json")
    assert "attachment" not in response.headers.get("content-disposition", "")
    body = response.json()
    slugs = [form["slug"] for form in body["forms"]]
    assert slugs == ["i-130", "i-130a", "i-485"]
    page = base64.b64decode(body["forms"][0]["pages"][0])
    assert page.startswith(b"\xff\xd8\xff")
    assert not response.content.startswith(b"%PDF")
    assert "i-864" in " ".join(body["notes"])


def test_unmapped_slug_is_not_found() -> None:
    response = client.post(
        "/fill-intake/i-765", json={"intake": DEMO, "acknowledged": True}
    )
    assert response.status_code == 404
