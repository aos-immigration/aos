"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sidebar } from "./Sidebar";
import { Breadcrumbs } from "./Breadcrumbs";
import { ThemeToggle } from "./ThemeToggle";
import { Verified, Download, Loader2 } from "lucide-react";
import { useApplicationId } from "@/app/lib/useApplicationId";
import { buildPdfPayload } from "@/app/lib/buildPdfPayload";
import type { AddressRow, EmploymentRow } from "@/app/lib/buildPdfPayload";
import { readPetitionerBasicsDraft } from "@/app/lib/reviewDraft";
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
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="h-14 border-b border-border flex items-center justify-between px-6 z-10 bg-background/80 backdrop-blur-sm">
          <Breadcrumbs />
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-3">
              <div className="text-[10px] font-mono text-muted-foreground">
                PROGRESS 64%
              </div>
              <div className="w-32 h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: "64%" }} />
              </div>
            </div>
            <div className="flex items-center gap-3">
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
                className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium px-4 py-2 rounded shadow-lg shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Verified className="w-4 h-4" />
                )}
                {isGenerating ? "Generating..." : "Verify & Preview"}
              </button>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-muted/30">
          {error && (
            <div className="mb-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {children}
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </main>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="flex h-[85vh] w-[90vw] max-w-6xl flex-col gap-4 p-6">
          <DialogHeader>
            <DialogTitle>PDF preview</DialogTitle>
            <DialogDescription>
              Generated I-130 from your application data.
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
