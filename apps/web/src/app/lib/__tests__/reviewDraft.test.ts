import { describe, expect, it, vi } from "vitest";
import { readPetitionerBasicsDraft, savePetitionerBasicsDraft } from "../reviewDraft";

describe("review draft", () => {
  it("does not keep an SSN that was smuggled into the draft", () => {
    const storage = new Map<string, string>();
    vi.stubGlobal("window", {
      sessionStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
      },
    });
    savePetitionerBasicsDraft({
      givenName: "Ada",
      familyName: "Lovelace",
      dateOfBirth: { month: "01", day: "02", year: "1990" },
      relationship: "spouse",
      ...({ ssn: "123-45-6789", aNumber: "A123456789" } as Record<string, string>),
    });
    const raw = [...storage.values()][0] ?? "";
    expect(raw).toContain("Ada");
    expect(raw).not.toContain("123-45-6789");
    expect(raw).not.toContain("A123456789");
    expect(readPetitionerBasicsDraft()?.givenName).toBe("Ada");
    vi.unstubAllGlobals();
  });
});
