/** @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

import { demoIntake } from "@/app/lib/intake/demo";
import { resetMemoryIntake, setMemoryIntake } from "@/app/lib/intake/memory";
import { IntakeProvider } from "./IntakeProvider";
import { ReviewScreen } from "./ReviewScreen";

beforeEach(() => {
  resetMemoryIntake();
});

describe("review screen", () => {
  it("stays locked on an empty intake", () => {
    render(
      <IntakeProvider>
        <ReviewScreen />
      </IntakeProvider>,
    );
    expect(screen.getByRole("heading", { name: "Review" })).toBeTruthy();
    expect(screen.getByText(/Review stays locked/)).toBeTruthy();
    expect(screen.getByText("No open checks.")).toBeTruthy();
    expect(screen.getByText("Specialist review, coming soon")).toBeTruthy();
  });

  it("shows the fictional couple once the demo is loaded", () => {
    setMemoryIntake(demoIntake());
    render(
      <IntakeProvider>
        <ReviewScreen />
      </IntakeProvider>,
    );
    expect(screen.getByText(/nothing open/)).toBeTruthy();
    expect(screen.getByText("Jordan Sampleton")).toBeTruthy();
    expect(screen.getByText("Avery Exampleton")).toBeTruthy();
    expect(screen.getAllByText("Fictional demo").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Sample City").length).toBeGreaterThan(0);
  });
});
