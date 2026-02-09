"use client";

import React from "react";
import {
  getAvailableForms,
  getAddressFieldsForForm,
} from "@/app/lib/pdfFieldMappings";
import type { IntakeData } from "@/app/lib/intakeStorage";
import { PdfVerifyButton } from "./PdfVerifyButton";

/* ------------------------------------------------------------------ */
/*  Category badges                                                    */
/* ------------------------------------------------------------------ */

const CATEGORY_LABELS: Record<string, { label: string; className: string }> = {
  mailing: {
    label: "Mailing",
    className:
      "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  },
  physical: {
    label: "Physical",
    className:
      "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
  },
  previous: {
    label: "Previous",
    className:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
  },
  overflow: {
    label: "Overflow",
    className:
      "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  },
};

function CategoryBadge({ category }: { category: string }) {
  const config = CATEGORY_LABELS[category] ?? {
    label: category,
    className: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${config.className}`}
    >
      {config.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  PdfVerifyPanel                                                     */
/* ------------------------------------------------------------------ */

export type PdfVerifyPanelProps = {
  /** Current intake data */
  data: IntakeData;
};

/**
 * PdfVerifyPanel
 *
 * Shows all supported USCIS forms with:
 *  - Which address field groups each form uses (as badges)
 *  - A preview button per form that generates a filled PDF
 *
 * This panel integrates `getAvailableForms()` and `getAddressFieldsForForm()`
 * from pdfFieldMappings.ts, and delegates PDF generation to PdfVerifyButton.
 */
export function PdfVerifyPanel({ data }: PdfVerifyPanelProps) {
  const forms = getAvailableForms();

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            PDF Form Verification
          </h2>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Preview how your address data maps to each USCIS form.
          </p>
        </div>
      </div>

      <div className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
        {forms.map((form) => {
          const fieldGroups = getAddressFieldsForForm(form.slug);

          return (
            <div
              key={form.slug}
              className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
            >
              {/* Left: form name + field badges */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {form.displayName}
                </p>

                {fieldGroups.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {fieldGroups.map((group, idx) => (
                      <CategoryBadge
                        key={`${group.category}-${idx}`}
                        category={group.category}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Right: preview button */}
              <PdfVerifyButton
                formSlug={form.slug}
                displayName={form.slug.toUpperCase()}
                data={data}
                compact
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
