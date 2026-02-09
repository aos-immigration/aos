"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { buildFormPayload } from "@/app/lib/pdfFieldMappings";
import type { IntakeData } from "@/app/lib/intakeStorage";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const DEFAULT_API_URL = "http://localhost:8000";

export type PdfVerifyButtonProps = {
  /** Form slug, e.g. "i-130" */
  formSlug: string;
  /** Display name shown on the button, e.g. "I-130" */
  displayName: string;
  /** Current intake data used to build the PDF payload */
  data: IntakeData;
  /** Optional: compact renders a smaller button suited for panels */
  compact?: boolean;
};

/**
 * PdfVerifyButton
 *
 * A button that, when clicked, sends the current intake data through
 * `buildFormPayload` from pdfFieldMappings.ts and calls the FastAPI
 * `/fill/:slug` endpoint to generate a filled PDF preview.
 *
 * The preview opens in a large dialog modal (85vh × 90vw) for readability,
 * with a download button.
 */
export function PdfVerifyButton({
  formSlug,
  displayName,
  data,
  compact = false,
}: PdfVerifyButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const apiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL,
    []
  );

  // Revoke blob URL on unmount or when replaced
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        globalThis.URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const payload = buildFormPayload(formSlug, data);

      const response = await fetch(`${apiBase}/fill/${formSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Fill failed (${response.status})`);
      }

      const blob = await response.blob();
      const url = globalThis.URL.createObjectURL(blob);

      // Revoke previous URL if any
      if (pdfUrl) {
        globalThis.URL.revokeObjectURL(pdfUrl);
      }

      setPdfUrl(url);
      setDialogOpen(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to generate PDF";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [formSlug, data, apiBase, pdfUrl]);

  const handleDownload = useCallback(() => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `${formSlug}-filled.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [pdfUrl, formSlug]);

  return (
    <>
      <Button
        type="button"
        variant={compact ? "outline" : "secondary"}
        size={compact ? "sm" : "default"}
        onClick={handleGenerate}
        disabled={isLoading}
        className={compact ? "text-xs" : ""}
      >
        {isLoading ? (
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 animate-spin rounded-full border-2 border-zinc-400 border-t-zinc-900 dark:border-zinc-500 dark:border-t-zinc-100" />
            Generating…
          </span>
        ) : (
          `Preview ${displayName}`
        )}
      </Button>

      {error && (
        <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[90vw] max-h-[85vh] w-full overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {displayName} — Filled PDF Preview
            </DialogTitle>
            <DialogDescription>
              Verify that your address data is correctly mapped to the PDF
              fields. Use this preview to check field placement before
              submitting.
            </DialogDescription>
          </DialogHeader>

          {pdfUrl && (
            <div className="flex-1 min-h-0 rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
              <iframe
                title={`${displayName} filled preview`}
                src={pdfUrl}
                className="h-full w-full min-h-[60vh] rounded-lg"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={!pdfUrl}
            >
              Download PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
