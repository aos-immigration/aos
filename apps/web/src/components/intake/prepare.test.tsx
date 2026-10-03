/** @vitest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
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
import { memoryIntake, resetMemoryIntake, setMemoryIntake } from "@/app/lib/intake/memory";
import { CostScreen } from "./CostScreen";
import { DocumentsScreen } from "./DocumentsScreen";
import { IntakeProvider } from "./IntakeProvider";
import { StartScreen } from "./StartScreen";

beforeEach(() => {
  resetMemoryIntake();
});

describe("start", () => {
  it("lists attorney topics and does not give a filing result", () => {
    render(<StartScreen />);
    expect(screen.getByRole("heading", { name: "Before you file" })).toBeTruthy();
    expect(screen.getByText("A prior marriage")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Continue to my forms" }).getAttribute("href")).toBe(
      "/sections",
    );
    expect(screen.queryByText(/eligible|you qualify|recommended/i)).toBeNull();
  });
});

describe("cost", () => {
  it("totals the selected forms and stores the filing method", () => {
    setMemoryIntake(demoIntake());
    render(
      <IntakeProvider>
        <CostScreen />
      </IntakeProvider>,
    );
    expect(screen.getByText("$3,005")).toBeTruthy();
    expect(screen.getAllByText("$0").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "online" }));
    expect(screen.getByText("$2,855")).toBeTruthy();
    expect(memoryIntake().filingMethod).toBe("online");
  });
});

describe("documents", () => {
  it("keeps a file name and never marks the file accepted", () => {
    setMemoryIntake(demoIntake());
    render(
      <IntakeProvider>
        <DocumentsScreen />
      </IntakeProvider>,
    );
    expect(screen.getByText("I-94 arrival record")).toBeTruthy();
    expect(screen.queryByText("Proof a prior marriage ended")).toBeNull();
    const input = document.querySelector('input[type="file"]');
    if (!(input instanceof HTMLInputElement)) throw new Error("missing file input");
    const file = new File(["id"], "passport.pdf", { type: "application/pdf" });
    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByText("passport.pdf")).toBeTruthy();
    expect(memoryIntake().documents[0]?.status).toBe("uploaded");
    expect(screen.queryByText(/accepted/i)).toBeNull();
  });
});
