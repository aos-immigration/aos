import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import BeneficiaryBiographicPage from "@/app/sections/beneficiary/biographic/page";
import FormBeneficiaryPage from "@/app/forms/i-130/beneficiary/page";
import FormPetitionerPage from "@/app/forms/i-130/petitioner/page";
import I485BiographicPage from "@/app/forms/i-485/biographic/page";
import DocumentsPage from "@/app/sections/documents/page";

const NOT_SAVED = "Not saved yet. This section does not store what you type.";

describe("mock sections", () => {
  it("does not prefill an eye color and says the biographic section is not saved", () => {
    const html = renderToStaticMarkup(<BeneficiaryBiographicPage />);
    expect(html).toContain(NOT_SAVED);
    expect(html).not.toContain("✓");
    expect(html).not.toContain("bg-primary/10");
  });

  it("does not prefill a beneficiary name or date of birth", () => {
    const html = renderToStaticMarkup(<FormBeneficiaryPage />);
    expect(html).toContain(NOT_SAVED);
    expect(html).not.toContain("Elena");
    expect(html).not.toContain("Rodriguez");
    expect(html).not.toContain("1992-05-14");
    expect(html).not.toContain("bg-border text-foreground");
  });

  it("does not show a fake A-Number, SSN, or street address", () => {
    const html = renderToStaticMarkup(<FormPetitionerPage />);
    expect(html).toContain(NOT_SAVED);
    expect(html).not.toContain("A-234 567 890");
    expect(html).not.toContain("XXX-XX-4421");
    expect(html).not.toContain("742 Evergreen Terrace");
    expect(html).not.toContain("2024-05-12");
  });

  it("shows document vault as not available and not saved", () => {
    const html = renderToStaticMarkup(<DocumentsPage />);
    expect(html).toContain("Document Vault");
    expect(html).toContain("not available yet");
    expect(html).toContain(NOT_SAVED);
  });

  it("does not show a completion percent or a preselected eye color", () => {
    const html = renderToStaticMarkup(<I485BiographicPage />);
    expect(html).toContain(NOT_SAVED);
    expect(html).not.toContain("64%");
    expect(html).not.toContain("✓");
    expect(html).not.toContain("bg-primary/10");
  });
});
