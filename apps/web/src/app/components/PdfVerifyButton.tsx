"use client";

import { useState } from "react";
import { loadIntake } from "@/app/lib/intakeStorage";
import { buildPdfPayload, FormSlug, FORM_NAMES, ALL_FORM_SLUGS } from "@/app/lib/pdfFieldMappings";
import { PdfPreviewModal } from "./PdfPreviewModal";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Props = {
  formSlug?: FormSlug;
  label?: string;
};

export function PdfVerifyButton({ formSlug: initialSlug = "i-130", label }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSlug, setCurrentSlug] = useState<FormSlug>(initialSlug);

  async function generatePdf(slug: FormSlug) {
    setIsLoading(true);
    setError(null);
    setCurrentSlug(slug);

    try {
      const data = loadIntake();
      const payload = buildPdfPayload(slug, data);

      const response = await fetch(`${API_BASE}/fill/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate PDF (${response.status})`);
      }

      const blob = await response.blob();
      if (pdfUrl) {
        globalThis.URL.revokeObjectURL(pdfUrl);
      }
      const url = globalThis.URL.createObjectURL(blob);
      setPdfUrl(url);
      setIsModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate PDF");
    } finally {
      setIsLoading(false);
    }
  }

  const handleFormChange = (slug: FormSlug) => {
    generatePdf(slug);
  };

  return (
    <>
      <button
        onClick={() => generatePdf(currentSlug)}
        disabled={isLoading}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-70 transition-colors"
      >
        {isLoading ? (
          <>
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
            </svg>
            Generating...
          </>
        ) : (
          label || `Preview ${FORM_NAMES[currentSlug]}`
        )}
      </button>
      {error && <span className="text-sm text-red-500 ml-2">{error}</span>}
      <PdfPreviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        pdfUrl={pdfUrl}
        formSlug={currentSlug}
        onFormChange={handleFormChange}
      />
    </>
  );
}
