/** @vitest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
import { memoryIntake, resetMemoryIntake } from "@/app/lib/intake/memory";
import { DisclaimerGate } from "./DisclaimerGate";
import { IntakeProvider } from "./IntakeProvider";
import { QuestionRun } from "./QuestionRun";

beforeEach(() => {
  resetMemoryIntake();
});

describe("question intake", () => {
  it("requires the disclaimer, then stores the tapped answer", () => {
    render(
      <IntakeProvider>
        <DisclaimerGate>
          <QuestionRun
            href="/sections/petitioner"
            doneHref="/sections/petitioner/address"
            steps={[
              {
                id: "sex",
                kind: "choice",
                title: "What is the petitioner's sex?",
                path: "petitioner.sex",
                advance: true,
                options: [
                  {
                    value: "female",
                    title: "Female",
                    definition: "As listed on the passport.",
                  },
                ],
              },
            ]}
          />
        </DisclaimerGate>
      </IntakeProvider>,
    );

    const continueButton = screen.getByRole("button", { name: "Continue" });
    expect(continueButton).toHaveProperty("disabled", true);
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(continueButton);
    fireEvent.click(screen.getByRole("button", { name: /Female/ }));

    expect(memoryIntake().disclaimerAckAt).toEqual(expect.any(String));
    expect(memoryIntake().petitioner.sex).toBe("female");
  });
});
