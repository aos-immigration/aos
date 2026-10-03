"use client";

import { useState, useCallback, useEffect } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sidebar } from "./Sidebar";
import { Breadcrumbs } from "./Breadcrumbs";
import { ThemeToggle } from "./ThemeToggle";
import { UserButton } from "@clerk/nextjs";
import { Eye, Download, Loader2 } from "lucide-react";
import { LifecycleRail } from "@/components/system/LifecycleRail";
import { ErrorState } from "@/components/system/States";
import { SiteFooter } from "@/components/system/SiteFooter";
import { useApplicationId } from "@/app/lib/useApplicationId";
import { useDemoMode } from "@/app/lib/intakeMode";
import { useRuntimeConfig } from "@/app/lib/runtimeConfigContext";
import { DEMO_BANNER } from "@/app/lib/demoCouple";
import { buildPdfPayload } from "@/app/lib/buildPdfPayload";
import type { AddressRow, EmploymentRow } from "@/app/lib/buildPdfPayload";
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

function DashboardFrame({
  children,
  demo,
  showAccount,
  error,
  isGenerating,
  previewDisabled,
  onPreview,
  onExport,
  exportDisabled,
  pdfUrl,
  isPreviewOpen,
  onPreviewOpenChange,
}: {
  children: React.ReactNode;
  demo: boolean;
  showAccount: boolean;
  error: string | null;
  isGenerating: boolean;
  previewDisabled: boolean;
  onPreview: () => void;
  onExport: () => void;
  exportDisabled: boolean;
  pdfUrl: string | null;
  isPreviewOpen: boolean;
  onPreviewOpenChange: (open: boolean) => void;
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="relative flex flex-1 flex-col overflow-hidden">
        {demo ? (
          <div className="border-b border-amber-500/30 bg-amber-500/15 px-6 py-2 text-sm text-amber-200">
            {DEMO_BANNER}
          </div>
        ) : null}
        <header className="z-10 border-b border-border bg-background">
          <div className="flex h-14 items-center justify-between px-6">
            <Breadcrumbs />
            <div className="flex items-center gap-3">
              {showAccount ? <UserButton /> : null}
              <ThemeToggle />
              {process.env.NODE_ENV === "development" && !demo ? (
                <button
                  onClick={onExport}
                  disabled={exportDisabled}
                  className="flex items-center gap-2 rounded border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-all hover:text-foreground disabled:opacity-50"
                >
                  <Download className="h-3 w-3" />
                  Export Fixture
                </button>
              ) : null}
              <button
                onClick={onPreview}
                disabled={previewDisabled}
                className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                {isGenerating ? "Preparing preview" : "Preview my forms"}
              </button>
            </div>
          </div>
          <div className="border-t border-border px-6 py-4">
            <LifecycleRail current="collect" />
          </div>
        </header>
        <div className="custom-scrollbar flex-1 overflow-y-auto bg-background">
          <div className="p-6 md:p-8">
            {error ? <ErrorState message={error} /> : null}
            {children}
          </div>
          <SiteFooter />
        </div>
      </main>
      <Dialog open={isPreviewOpen} onOpenChange={onPreviewOpenChange}>
        <DialogContent className="flex h-[85vh] w-[90vw] max-w-6xl flex-col gap-4 p-6">
          <DialogHeader>
            <DialogTitle>Preview: Form I-130</DialogTitle>
            <DialogDescription>
              {demo
                ? "Sample I-130 for Alex Demo and Jamie Demo. It is not a filing."
                : "This is a draft made from your answers. Check every field against the USCIS instructions before you sign."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800">
            {pdfUrl ? (
              <iframe title="I-130 preview" src={pdfUrl} className="h-full w-full" />
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

function usePdfPreview() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (pdfUrl) globalThis.URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const showPdf = useCallback((blob: Blob) => {
    const url = globalThis.URL.createObjectURL(blob);
    setPdfUrl((current) => {
      if (current) globalThis.URL.revokeObjectURL(current);
      return url;
    });
    setIsPreviewOpen(true);
  }, []);

  return { isGenerating, setIsGenerating, pdfUrl, isPreviewOpen, setIsPreviewOpen, error, setError, showPdf };
}

async function demoPdfBlob() {
  const response = await fetch("/api/fill/i-130", { method: "POST" });
  if (!response.ok) throw new Error(`Failed to generate PDF (${response.status})`);
  return response.blob();
}

function DemoDashboard({ children }: DashboardLayoutProps) {
  const preview = usePdfPreview();
  const onPreview = useCallback(async () => {
    preview.setIsGenerating(true);
    preview.setError(null);
    try {
      preview.showPdf(await demoPdfBlob());
    } catch (err) {
      preview.setError(err instanceof Error ? err.message : "Failed to generate PDF");
    } finally {
      preview.setIsGenerating(false);
    }
  }, [preview]);

  return (
    <DashboardFrame
      demo
      showAccount={false}
      error={preview.error}
      isGenerating={preview.isGenerating}
      previewDisabled={preview.isGenerating}
      onPreview={onPreview}
      onExport={() => undefined}
      exportDisabled
      pdfUrl={preview.pdfUrl}
      isPreviewOpen={preview.isPreviewOpen}
      onPreviewOpenChange={preview.setIsPreviewOpen}
    >
      {children}
    </DashboardFrame>
  );
}

function LiveDashboard({ children }: DashboardLayoutProps) {
  const applicationId = useApplicationId();
  const fillI130 = useAction(api.sensitive.fillI130);
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
  const preview = usePdfPreview();

  const onPreview = useCallback(async () => {
    if (!applicationId) {
      preview.setError("No petitioner data found. Please fill in the basic information first.");
      return;
    }
    preview.setIsGenerating(true);
    preview.setError(null);
    try {
      const pdf = await fillI130({});
      const binary = atob(pdf);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      preview.showPdf(new Blob([bytes], { type: "application/pdf" }));
    } catch (err) {
      preview.setError(err instanceof Error ? err.message : "Failed to generate PDF");
    } finally {
      preview.setIsGenerating(false);
    }
  }, [applicationId, fillI130, preview]);

  const onExport = useCallback(() => {
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
    const blob = new Blob([JSON.stringify(fixture, null, 2)], { type: "application/json" });
    const url = globalThis.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `i-130-fixture-${Date.now()}.json`;
    a.click();
    globalThis.URL.revokeObjectURL(url);
  }, [addresses, basics, employment]);

  return (
    <DashboardFrame
      demo={false}
      showAccount
      error={preview.error}
      isGenerating={preview.isGenerating}
      previewDisabled={preview.isGenerating || !applicationId}
      onPreview={onPreview}
      onExport={onExport}
      exportDisabled={!basics}
      pdfUrl={preview.pdfUrl}
      isPreviewOpen={preview.isPreviewOpen}
      onPreviewOpenChange={preview.setIsPreviewOpen}
    >
      {children}
    </DashboardFrame>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const demo = useDemoMode();
  const { clerk, convex } = useRuntimeConfig();
  if (demo || !clerk || !convex) return <DemoDashboard>{children}</DemoDashboard>;
  return <LiveDashboard>{children}</LiveDashboard>;
}
