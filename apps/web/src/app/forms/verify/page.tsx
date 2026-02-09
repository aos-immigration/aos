"use client";

import { useState, useEffect } from "react";
import { loadIntake, IntakeData } from "@/app/lib/intakeStorage";
import { buildPdfPayload, FormSlug, FORM_NAMES, ALL_FORM_SLUGS } from "@/app/lib/pdfFieldMappings";
import { PdfPreviewModal } from "@/app/components/PdfPreviewModal";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function VerifyPage() {
  const [data, setData] = useState<IntakeData | null>(null);
  const [isLoading, setIsLoading] = useState<FormSlug | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSlug, setCurrentSlug] = useState<FormSlug>("i-130");

  useEffect(() => {
    setData(loadIntake());
  }, []);

  async function generatePdf(slug: FormSlug) {
    if (!data) return;
    setIsLoading(slug);
    setError(null);
    setCurrentSlug(slug);

    try {
      const payload = buildPdfPayload(slug, data);
      const response = await fetch(`${API_BASE}/fill/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Failed (${response.status})`);

      const blob = await response.blob();
      if (pdfUrl) globalThis.URL.revokeObjectURL(pdfUrl);
      const url = globalThis.URL.createObjectURL(blob);
      setPdfUrl(url);
      setIsModalOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate PDF");
    } finally {
      setIsLoading(null);
    }
  }

  const currentAddr = data?.addresses.find((a) => a.isCurrent) || data?.addresses[0];
  const prevAddrs = data?.addresses.filter((a) => !a.isCurrent) || [];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">
          Verify Filled PDFs
        </h1>
        <p className="text-muted-foreground text-sm max-w-xl">
          Preview how your data will appear on each immigration form.
          Click any form to see a filled PDF preview.
        </p>
      </div>

      {/* Data Summary */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold mb-4">Data Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
            <div className="font-medium text-zinc-900 dark:text-zinc-100">Petitioner</div>
            <div className="text-zinc-600 dark:text-zinc-400 mt-1">
              {data?.basics.petitioner.givenName && data?.basics.petitioner.familyName
                ? `${data.basics.petitioner.givenName} ${data.basics.petitioner.familyName}`
                : "Not entered"}
            </div>
          </div>
          <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
            <div className="font-medium text-zinc-900 dark:text-zinc-100">Current Address</div>
            <div className="text-zinc-600 dark:text-zinc-400 mt-1">
              {currentAddr?.street
                ? `${currentAddr.street}, ${currentAddr.city}, ${currentAddr.state}`
                : "Not entered"}
            </div>
          </div>
          <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
            <div className="font-medium text-zinc-900 dark:text-zinc-100">Previous Addresses</div>
            <div className="text-zinc-600 dark:text-zinc-400 mt-1">
              {prevAddrs.length} address{prevAddrs.length !== 1 ? "es" : ""} on file
            </div>
          </div>
        </div>
      </div>

      {/* Form Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALL_FORM_SLUGS.map((slug) => {
          const payload = data ? buildPdfPayload(slug, data) : null;
          const fieldCount = payload ? Object.keys(payload.fields).filter(k => payload.fields[k]).length : 0;
          const loading = isLoading === slug;
          
          return (
            <div
              key={slug}
              className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 flex flex-col"
            >
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                {slug.toUpperCase()}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1 flex-1">
                {FORM_NAMES[slug]}
              </p>
              <div className="text-xs text-zinc-500 mt-3 mb-4">
                {fieldCount} field{fieldCount !== 1 ? "s" : ""} will be filled
              </div>
              <button
                onClick={() => generatePdf(slug)}
                disabled={loading}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70 transition-colors"
              >
                {loading ? "Generating..." : "Preview PDF"}
              </button>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          {error}
        </div>
      )}

      <PdfPreviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        pdfUrl={pdfUrl}
        formSlug={currentSlug}
        onFormChange={(slug) => generatePdf(slug)}
      />
    </div>
  );
}
