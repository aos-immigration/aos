/** @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FormPreview } from "./FormPreview";
import { DOWNLOAD_BOXES, DOWNLOAD_HEADING, PREPARER_NOTE, START_LEAD } from "./trustCopy";

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

describe("form preview acknowledgements", () => {
  it("uses the download copy and keeps the PDF button off until every box is checked", () => {
    const { container } = render(
      <FormPreview
        forms={[{ slug: "i-130", title: "Form I-130", pages: [] }]}
        notes={[]}
        loading={false}
        downloading={false}
        acks={[false, false, false, false]}
        onToggle={() => undefined}
        onDownload={() => undefined}
      />,
    );

    expect(screen.getByRole("heading", { name: DOWNLOAD_HEADING })).toBeTruthy();
    expect(screen.getByText(/AOS did not review them for legal accuracy\./)).toBeTruthy();
    expect(screen.getByText(START_LEAD)).toBeTruthy();
    for (const box of DOWNLOAD_BOXES) {
      expect(screen.getByText(box)).toBeTruthy();
    }
    expect(container.textContent).toContain(PREPARER_NOTE);
    expect(container.textContent).toContain(
      "These forms were filled in from the answers you gave. AOS did not review them for legal accuracy.",
    );
    expect(screen.getByRole("button", { name: "Download my forms (PDF)" })).toHaveProperty(
      "disabled",
      true,
    );
    expect(screen.getByRole("link", { name: "Talk to an attorney first" }).getAttribute("href")).toBe(
      "/start",
    );
    expect(screen.queryByRole("link", { name: "Find legal help instead" })).toBeNull();
    expect(container.querySelector("iframe")).toBeNull();
  });
});
