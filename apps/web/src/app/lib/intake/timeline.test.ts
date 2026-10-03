import { describe, expect, it } from "vitest";
import { emptyIntake } from "./empty";
import { addressBars } from "./timeline";
import type { IntakeAddress } from "./schema";

const AS_OF = new Date(2026, 9, 3);

function row(partial: Partial<IntakeAddress> & Pick<IntakeAddress, "id">): IntakeAddress {
  return {
    personRole: "petitioner",
    kind: "physical",
    street: "100 Fictional Lane",
    unitType: "",
    unit: "",
    city: "Sample City",
    state: "CA",
    province: "",
    postal: "00000",
    country: "United States",
    startMonth: "10",
    startYear: "2021",
    endMonth: "",
    endYear: "",
    isCurrent: true,
    gapExplanation: "",
    ...partial,
  };
}

describe("addressBars", () => {
  it("marks a gap and an overlap inside the five-year window", () => {
    const intake = emptyIntake();
    const bars = addressBars(
      [
        row({ id: "a", startMonth: "01", startYear: "2024", endMonth: "06", endYear: "2024", isCurrent: false, city: "First" }),
        row({ id: "b", startMonth: "06", startYear: "2024", endMonth: "08", endYear: "2024", isCurrent: false, city: "Overlap" }),
        row({ id: "c", startMonth: "11", startYear: "2024", endMonth: "12", endYear: "2024", isCurrent: false, city: "Later" }),
      ],
      "petitioner",
      AS_OF,
    );
    expect(bars.find((bar) => bar.id === "a")?.gapBefore).toBe(true);
    expect(bars.find((bar) => bar.id === "b")?.overlap).toBe(true);
    expect(bars.find((bar) => bar.id === "c")?.gapBefore).toBe(true);
    const explained = addressBars(
      [
        row({ id: "a", startMonth: "01", startYear: "2024", endMonth: "06", endYear: "2024", isCurrent: false }),
        row({
          id: "c",
          startMonth: "11",
          startYear: "2024",
          endMonth: "12",
          endYear: "2024",
          isCurrent: false,
          gapExplanation: "Travel",
        }),
      ],
      "petitioner",
      AS_OF,
    );
    expect(explained.find((bar) => bar.id === "c")?.gapBefore).toBe(false);
    expect(intake.addresses).toEqual([]);
  });
});
