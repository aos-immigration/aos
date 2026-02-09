"use client";

import { FormSlug, ALL_FORM_SLUGS, FORM_NAMES } from "@/app/lib/pdfFieldMappings";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string | null;
  formSlug: FormSlug;
  onFormChange: (slug: FormSlug) => void;
};

export function PdfPreviewModal({ isOpen, onClose, pdfUrl, formSlug, onFormChange }: Props) {
  if (!isOpen) return null;

  const handleDownload = () => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `${formSlug}-filled.pdf`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative flex h-[90vh] w-[90vw] flex-col rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-700">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              PDF Preview
            </h2>
            <select
              value={formSlug}
              onChange={(e) => onFormChange(e.target.value as FormSlug)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            >
              {ALL_FORM_SLUGS.map((slug) => (
                <option key={slug} value={slug}>
                  {FORM_NAMES[slug]}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Download
            </button>
            <button
              onClick={onClose}
              className="rounded-lg bg-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
            >
              ✕
            </button>
          </div>
        </div>
        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden p-4">
          {pdfUrl ? (
            <iframe
              title={`${FORM_NAMES[formSlug]} preview`}
              src={pdfUrl}
              className="h-full w-full rounded-lg border border-zinc-200 bg-white dark:border-zinc-700"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-500">
              No PDF loaded
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
