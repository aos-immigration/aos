"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export interface PdfPreviewDialogProps {
  /** Whether the dialog is open. */
  open: boolean;
  /** Callback fired when the dialog open state should change. */
  onOpenChange: (open: boolean) => void;
  /** Form slug determining the API endpoint, e.g. "i-130". */
  formSlug: string;
  /** Payload sent to the PDF fill API. `null` means "nothing to generate". */
  payload: {
    fields: Record<string, string>;
    checkboxes: Record<string, boolean>;
  } | null;
  /** Dialog title displayed in the header. @default "PDF Preview" */
  title?: string;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function PdfPreviewDialog({
  open,
  onOpenChange,
  formSlug,
  payload,
  title = "PDF Preview",
}: PdfPreviewDialogProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track the latest blob URL so we can revoke on cleanup / re-fetch.
  const blobUrlRef = useRef<string | null>(null);

  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  /* ---- helpers ---------------------------------------------------------- */

  const revokePreviousUrl = useCallback(() => {
    if (blobUrlRef.current) {
      globalThis.URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, []);

  const fetchPdf = useCallback(async () => {
    if (!payload) return;

    setIsLoading(true);
    setError(null);
    revokePreviousUrl();
    setPdfUrl(null);

    try {
      const response = await fetch(`${apiUrl}/fill/${formSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const blob = await response.blob();
      const url = globalThis.URL.createObjectURL(blob);
      blobUrlRef.current = url;
      setPdfUrl(url);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to generate PDF";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, formSlug, payload, revokePreviousUrl]);

  /* ---- effects ---------------------------------------------------------- */

  // Fetch the PDF whenever the dialog opens with a valid payload.
  useEffect(() => {
    if (open && payload) {
      void fetchPdf();
    }

    // When the dialog closes, revoke the blob URL to free memory.
    if (!open) {
      revokePreviousUrl();
      setPdfUrl(null);
      setError(null);
    }
  }, [open, payload, fetchPdf, revokePreviousUrl]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      revokePreviousUrl();
    };
  }, [revokePreviousUrl]);

  /* ---- render ----------------------------------------------------------- */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex h-[85vh] w-[90vw] max-w-7xl flex-col gap-4 p-6"
        )}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Preview the generated PDF with your filled-in data.
          </DialogDescription>
        </DialogHeader>

        <div
          className={cn(
            "flex flex-1 items-center justify-center overflow-hidden rounded-xl border",
            "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
          )}
        >
          {/* ---- Loading state ---- */}
          {isLoading ? (
            <div className="flex flex-col items-center gap-3">
              {/* Simple animated spinner */}
              <svg
                className="h-8 w-8 animate-spin text-zinc-400"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Generating PDF&hellip;
              </p>
            </div>
          ) : error ? (
            /* ---- Error state ---- */
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
              <Button type="button" variant="secondary" onClick={fetchPdf}>
                Retry
              </Button>
            </div>
          ) : pdfUrl ? (
            /* ---- PDF preview ---- */
            <iframe
              title={`${title} — ${formSlug}`}
              src={pdfUrl}
              className="h-full w-full"
            />
          ) : (
            /* ---- Empty / waiting state ---- */
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No PDF to display.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
