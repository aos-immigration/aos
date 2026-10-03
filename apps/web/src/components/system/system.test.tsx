/** @vitest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChoiceCard } from "./ChoiceCard";
import { DISCLAIMER, PRIVACY_LINES, visibleCopy } from "./copy";
import { LifecycleRail } from "./LifecycleRail";
import { QuestionFrame } from "./QuestionFrame";
import { stageVisual } from "./stages";
import { WhyWeAsk } from "./WhyWeAsk";

describe("disclaimer copy", () => {
  it("keeps the three required phrases intact", () => {
    const text = DISCLAIMER.toLowerCase();
    expect(text).toContain("not a substitute for the advice of an attorney");
    expect(text).toContain("not a law firm");
    expect(text).toContain("not affiliated with uscis");
  });

  it("hides privacy lines that still need a security fix", () => {
    const visible = visibleCopy(PRIVACY_LINES).map((line) => line.text).join(" ");
    expect(visible).toContain("don't sell your information");
    expect(visible).toContain("don't record your screen");
    expect(visible).not.toContain("encrypt");
    expect(visible).not.toContain("signed in");
  });
});

describe("stageVisual", () => {
  it("does not mark earlier stages done unless they are listed", () => {
    expect(stageVisual("start", "collect", [])).toBe("upcoming");
    expect(stageVisual("collect", "collect", [])).toBe("current");
    expect(stageVisual("file", "collect", [])).toBe("upcoming");
    expect(stageVisual("start", "collect", ["start"])).toBe("done");
  });
});

describe("LifecycleRail", () => {
  it("shows that the user submits and marks nothing done by default", () => {
    render(<LifecycleRail current={null} />);
    expect(screen.getByText("You submit to USCIS")).toBeTruthy();
    const file = document.querySelector('[data-stage="file"]');
    expect(file?.getAttribute("data-state")).toBe("upcoming");
    const start = document.querySelector('[data-stage="start"]');
    expect(start?.getAttribute("data-state")).toBe("upcoming");
  });
});

describe("WhyWeAsk", () => {
  it("keeps the explanation hidden until opened", () => {
    render(<WhyWeAsk>USCIS asks for the city of birth.</WhyWeAsk>);
    expect(screen.queryByText("USCIS asks for the city of birth.")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Why we ask" }));
    expect(screen.getByText("USCIS asks for the city of birth.")).toBeTruthy();
  });
});

describe("ChoiceCard", () => {
  it("calls onSelect when tapped", () => {
    const onSelect = vi.fn();
    render(
      <ChoiceCard
        title="Spouse"
        definition="You're legally married."
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Spouse/ }));
    expect(onSelect).toHaveBeenCalledOnce();
  });
});

describe("QuestionFrame", () => {
  it("shows the question count and the next action", () => {
    const onNext = vi.fn();
    render(
      <QuestionFrame
        index={2}
        total={6}
        title="Who is the petitioner?"
        note="Automatic cross-form checks."
        onNext={onNext}
      >
        <p>The person filing the petition.</p>
      </QuestionFrame>,
    );
    expect(screen.getByText("Question 2 of 6")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(onNext).toHaveBeenCalledOnce();
  });
});
