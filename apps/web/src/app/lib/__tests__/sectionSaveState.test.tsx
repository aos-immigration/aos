import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SavedSectionsLabel } from "@/components/SavedSectionsLabel";
import {
  draftLabel,
  groupSaveState,
  savedSectionCount,
  sectionSaveState,
  type IntakeSnapshot,
} from "../sectionSaveState";

const empty: IntakeSnapshot = {
  petitionerGivenName: "",
  petitionerFamilyName: "",
  petitionerAddressCount: 0,
  petitionerEmploymentCount: 0,
  beneficiaryAddressCount: 0,
};

describe("sectionSaveState", () => {
  it("counts a section as saved only when that section has stored data", () => {
    expect(sectionSaveState("/sections/petitioner", empty)).toBe("not-saved");
    expect(sectionSaveState("/sections/beneficiary", empty)).toBe("not-saved");
    expect(sectionSaveState("/sections/documents", empty)).toBe("not-saved");
    expect(sectionSaveState("/sections/marital", empty)).toBe("not-saved");

    const named: IntakeSnapshot = {
      ...empty,
      petitionerGivenName: "  Ana ",
      petitionerFamilyName: "Ng",
      petitionerAddressCount: 1,
    };
    expect(sectionSaveState("/sections/petitioner", named)).toBe("saved");
    expect(sectionSaveState("/sections/petitioner/address", named)).toBe("saved");
    expect(sectionSaveState("/sections/petitioner/employment", named)).toBe("not-saved");
    expect(sectionSaveState("/sections/beneficiary/address", named)).toBe("not-saved");
    expect(savedSectionCount(named)).toBe(2);
    expect(savedSectionCount(empty)).toBe(0);
  });

  it("does not treat a blank name as saved", () => {
    expect(
      sectionSaveState("/sections/petitioner", {
        ...empty,
        petitionerGivenName: "   ",
        petitionerFamilyName: "Ng",
      }),
    ).toBe("not-saved");
  });

  it("marks a group saved only when every child section is saved", () => {
    const partial: IntakeSnapshot = {
      ...empty,
      petitionerGivenName: "Ana",
      petitionerFamilyName: "Ng",
    };
    expect(
      groupSaveState(
        ["/sections/petitioner", "/sections/petitioner/address", "/sections/petitioner/employment"],
        partial,
      ),
    ).toBe("partial");
    expect(
      groupSaveState(
        ["/sections/beneficiary", "/sections/beneficiary/address"],
        { ...empty, beneficiaryAddressCount: 2 },
      ),
    ).toBe("partial");
    expect(groupSaveState(["/sections/documents", "/sections/proof"], empty)).toBe("empty");
    expect(
      groupSaveState(["/sections/petitioner/address"], {
        ...empty,
        petitionerAddressCount: 1,
      }),
    ).toBe("saved");
  });

  it("uses the saved petitioner name and never a placeholder identity", () => {
    expect(draftLabel(empty)).toEqual({ initials: "", name: "Not saved yet" });
    expect(
      draftLabel({
        ...empty,
        petitionerGivenName: "ana",
        petitionerFamilyName: "ng",
      }),
    ).toEqual({ initials: "AN", name: "ana ng" });
  });
});

describe("SavedSectionsLabel", () => {
  it("states how many persistable sections are saved and does not show a percent", () => {
    const html = renderToStaticMarkup(<SavedSectionsLabel saved={1} persistable={4} />);
    expect(html).toContain("1 of 4 sections saved");
    expect(html).toContain("Other sections are not stored yet.");
    expect(html).not.toContain("%");
    expect(html).not.toContain("64");
  });
});
