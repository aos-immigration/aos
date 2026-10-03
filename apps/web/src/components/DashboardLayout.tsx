"use client";

import { useState, useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Breadcrumbs } from "./Breadcrumbs";
import { ThemeToggle } from "./ThemeToggle";
import { Eye, Download, Loader2 } from "lucide-react";
import { LifecycleRail } from "@/components/system/LifecycleRail";
import type { StageId } from "@/components/system/stages";
import { ErrorState } from "@/components/system/States";
import { SiteFooter } from "@/components/system/SiteFooter";
import { DISCLAIMER } from "@/components/system/copy";
import { useIntake } from "@/components/intake/IntakeProvider";
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

function stageFor(pathname: string): StageId {
  if (pathname === "/start" || pathname === "/cost") return "start";
  if (pathname.startsWith("/sections/review")) return "review";
  return "collect";
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="z-10 border-b border-border bg-background">
          <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6">
            <Breadcrumbs />
            <div className="flex items-center gap-3">
              <SaveStatus />
              <LoadDemoButton />
              <ThemeToggle />
              <PreviewControls />
            </div>
          </div>
          <div className="border-t border-border px-6 py-4">
            <LifecycleRail current={stageFor(pathname)} />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-background">
          <div className="p-6 md:p-8">{children}</div>
          <SiteFooter />
        </div>
      </main>
    </div>
  );
}

function SaveStatus() {
  const { status, error } = useIntake();
  if (status === "idle") return null;
  return (
    <span className="max-w-48 truncate text-sm" role="status">
      {status === "saving" ? "Saving" : status === "saved" ? "Saved" : error}
    </span>
  );
}

function LoadDemoButton() {
  const { loadDemo } = useIntake();
  return (
    <button
      type="button"
      onClick={loadDemo}
      className="text-sm underline decoration-foreground/30 underline-offset-4"
    >
      Load demo
    </button>
  );
}

const DOWNLOAD_ACKS = [
  "AOS is not a law firm.",
  "AOS is not a substitute for the advice of an attorney.",
  "AOS is not affiliated with USCIS.",
  "I will check this draft before I sign or file it.",
] as const;

function PreviewControls() {
  const { intake } = useIntake();
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [acks, setAcks] = useState<boolean[]>(() => DOWNLOAD_ACKS.map(() => false));
  const [error, setError] = useState<string | null>(null);

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        globalThis.URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const handleReviewPackage = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase}/fill-intake/i-130`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intake }),
      });
      if (!response.ok) {
        throw new Error(`Failed to generate PDF (${response.status})`);
      }
      const blob = await response.blob();
      const url = globalThis.URL.createObjectURL(blob);
      if (pdfUrl) globalThis.URL.revokeObjectURL(pdfUrl);
      setPdfUrl(url);
      setIsPreviewOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate PDF");
    } finally {
      setIsGenerating(false);
    }
  }, [apiBase, intake, pdfUrl]);

  const handleDownload = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase}/packet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intake }),
      });
      if (!response.ok) {
        throw new Error(`Failed to build the packet (${response.status})`);
      }
      const blob = await response.blob();
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "aos-packet.zip";
      a.click();
      globalThis.URL.revokeObjectURL(url);
      setDownloadOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to build the packet");
    } finally {
      setIsGenerating(false);
    }
  }, [apiBase, intake]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setAcks(DOWNLOAD_ACKS.map(() => false));
          setDownloadOpen(true);
        }}
        className="text-sm underline decoration-foreground/30 underline-offset-4"
      >
        Download my forms (PDF)
      </button>
      <button
        onClick={handleReviewPackage}
        disabled={isGenerating}
        className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
      >
        {isGenerating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Eye className="w-4 h-4" />
        )}
        {isGenerating ? "Preparing preview" : "Preview my forms"}
      </button>
      {error ? <ErrorState message={error} /> : null}
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
      <Dialog open={downloadOpen} onOpenChange={setDownloadOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Download the draft packet</DialogTitle>
            <DialogDescription>{DISCLAIMER}</DialogDescription>
          </DialogHeader>
          <ul className="space-y-3">
            {DOWNLOAD_ACKS.map((label, index) => (
              <li key={label}>
                <label className="flex items-start gap-3 text-sm leading-6">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={acks[index]}
                    onChange={(event) =>
                      setAcks((current) =>
                        current.map((value, item) => (item === index ? event.target.checked : value)),
                      )
                    }
                  />
                  <span>{label}</span>
                </label>
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="inline-flex h-12 items-center gap-2 rounded-md bg-primary px-6 text-base font-medium text-primary-foreground disabled:opacity-40"
            disabled={isGenerating || acks.some((checked) => !checked)}
            onClick={handleDownload}
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download my forms (PDF)
          </button>
        </DialogContent>
      </Dialog>
    </>
  );
}
