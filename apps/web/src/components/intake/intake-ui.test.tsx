/** @vitest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
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

    expect(screen.getByRole("heading", { name: "Before you start" })).toBeTruthy();
    expect(screen.getAllByText(/not a substitute for the advice of an attorney/).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "Find legal help instead" }).getAttribute("href")).toBe(
      "/start",
    );
    const continueButton = screen.getByRole("button", { name: "Continue" });
    expect(continueButton).toHaveProperty("disabled", true);
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(continueButton);
    fireEvent.click(screen.getByRole("button", { name: /Female/ }));

    expect(memoryIntake().disclaimerAckAt).toEqual(expect.any(String));
    expect(memoryIntake().petitioner.sex).toBe("female");
  });

  it("disables SSN, A-Number, passport, and I-94 on the public demo", () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_ONLY", "1");
    render(
      <IntakeProvider>
        <QuestionRun
          href="/sections/petitioner"
          doneHref="/sections"
          steps={[
            {
              id: "ids",
              kind: "fields",
              title: "Identity numbers",
              fields: [
                { path: "petitioner.ssn", label: "Social Security number", sensitive: true },
                { path: "petitioner.aNumber", label: "A-Number", sensitive: true },
                { path: "immigration.passportNumber", label: "Passport number", sensitive: true },
                { path: "immigration.i94Number", label: "I-94 number", sensitive: true },
                { path: "petitioner.email", label: "Email", input: "email" },
              ],
            },
          ]}
        />
      </IntakeProvider>,
    );

    for (const label of ["Social Security number", "A-Number", "Passport number", "I-94 number"]) {
      expect(screen.getByLabelText(label)).toHaveProperty("disabled", true);
    }
    expect(screen.getByLabelText("Email")).toHaveProperty("disabled", false);
    expect(screen.getAllByText("This public demo does not collect this number.")).toHaveLength(4);
    vi.unstubAllEnvs();
  });
});
