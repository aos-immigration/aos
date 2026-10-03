"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sidebar } from "./Sidebar";
import { Breadcrumbs } from "./Breadcrumbs";
import { ThemeToggle } from "./ThemeToggle";
import { Eye, Download, Loader2 } from "lucide-react";
import { LifecycleRail } from "@/components/system/LifecycleRail";
import { ErrorState } from "@/components/system/States";
import { SiteFooter } from "@/components/system/SiteFooter";
import { useApplicationId } from "@/app/lib/useApplicationId";
import { buildPdfPayload } from "@/app/lib/buildPdfPayload";
import type { AddressRow, EmploymentRow } from "@/app/lib/buildPdfPayload";
import { readPetitionerBasicsDraft } from "@/app/lib/reviewDraft";
import {
  PERSISTABLE_SECTION_HREFS,
  savedSectionCount,
  type IntakeSnapshot,
} from "@/app/lib/sectionSaveState";
import { SavedSectionsLabel } from "@/components/SavedSectionsLabel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const applicationId = useApplicationId();

  const basics = useQuery(
    api.petitioner.getPetitionerBasics,
    applicationId ? { applicationId } : "skip",
  );
  const addresses = useQuery(
    api.petitioner.listAddresses,
    applicationId ? { applicationId, personRole: "petitioner" } : "skip",
  );
  const employment = useQuery(
    api.petitioner.listEmploymentEntries,
    applicationId ? { applicationId, personRole: "petitioner" } : "skip",
  );
  const beneficiaryAddresses = useQuery(
    api.petitioner.listAddresses,
    applicationId ? { applicationId, personRole: "beneficiary" } : "skip",
  );

  const intakeLoaded =
    basics !== undefined &&
    addresses !== undefined &&
    employment !== undefined &&
    beneficiaryAddresses !== undefined;
  const snapshot: IntakeSnapshot | null =
    applicationId && !intakeLoaded
      ? null
      : {
          petitionerGivenName: basics?.givenName ?? "",
          petitionerFamilyName: basics?.familyName ?? "",
          petitionerAddressCount: addresses?.length ?? 0,
          petitionerEmploymentCount: employment?.length ?? 0,
          beneficiaryAddressCount: beneficiaryAddresses?.length ?? 0,
        };

  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        globalThis.URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const handleReviewPackage = useCallback(async () => {
    const basicsForPreview = readPetitionerBasicsDraft() ?? basics;
    if (!basicsForPreview) {
      setError("No petitioner data found. Please fill in the basic information first.");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const payload = buildPdfPayload(
        basicsForPreview,
        (addresses ?? []) as AddressRow[],
        (employment ?? []) as EmploymentRow[],
      );

      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiBase}/fill/i-130`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate PDF (${response.status})`);
      }

      const blob = await response.blob();
      const url = globalThis.URL.createObjectURL(blob);

      if (pdfUrl) {
        globalThis.URL.revokeObjectURL(pdfUrl);
      }

      setPdfUrl(url);
      setIsPreviewOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
  }, [basics, addresses, employment, pdfUrl]);

  const handleExportFixture = useCallback(() => {
    if (!basics) return;

    const payload = buildPdfPayload(
      basics,
      (addresses ?? []) as AddressRow[],
      (employment ?? []) as EmploymentRow[],
    );

    const fixture = {
      description: `i-130 fixture exported on ${new Date().toISOString().slice(0, 10)}`,
      slug: "i-130",
      payload,
      expected_values: { ...payload.fields },
    };

    const blob = new Blob([JSON.stringify(fixture, null, 2)], {
      type: "application/json",
    });
    const url = globalThis.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `i-130-fixture-${Date.now()}.json`;
    a.click();
    globalThis.URL.revokeObjectURL(url);
  }, [basics, addresses, employment]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        snapshot={
          snapshot ?? {
            petitionerGivenName: "",
            petitionerFamilyName: "",
            petitionerAddressCount: 0,
            petitionerEmploymentCount: 0,
            beneficiaryAddressCount: 0,
          }
        }
      />
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="z-10 border-b border-border bg-background">
          <div className="flex h-14 items-center justify-between px-6">
            <Breadcrumbs />
            <div className="flex items-center gap-3">
              {snapshot ? (
                <SavedSectionsLabel
                  persistable={PERSISTABLE_SECTION_HREFS.length}
                  saved={savedSectionCount(snapshot)}
                />
              ) : (
                <div className="text-[10px] font-mono text-muted-foreground">
                  Checking saved sections
                </div>
              )}
              <ThemeToggle />
              {process.env.NODE_ENV === "development" && (
                <button
                  onClick={handleExportFixture}
                  disabled={!basics}
                  className="text-muted-foreground hover:text-foreground text-xs font-medium px-3 py-2 rounded border border-border transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Download className="w-3 h-3" />
                  Export Fixture
                </button>
              )}
              <button
                onClick={handleReviewPackage}
                disabled={isGenerating || !applicationId}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                {isGenerating ? "Preparing preview" : "Preview my forms"}
              </button>
            </div>
          </div>
          <div className="border-t border-border px-6 py-4">
            <LifecycleRail current="collect" />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-background">
          <div className="p-6 md:p-8">
            {error ? <ErrorState message={error} /> : null}
            {children}
          </div>
          <SiteFooter />
        </div>
      </main>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="flex h-[85vh] w-[90vw] max-w-6xl flex-col gap-4 p-6">
          <DialogHeader>
            <DialogTitle>Preview: Form I-130</DialogTitle>
            <DialogDescription>
              This is a draft made from your answers. Check every field against the USCIS instructions before you sign.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800">
            {pdfUrl ? (
              <iframe
                title="I-130 preview"
                src={pdfUrl}
                className="h-full w-full"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                Generate a preview to view the PDF.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
