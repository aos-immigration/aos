"use client";

import Link from "next/link";
import { Download, Loader2 } from "lucide-react";
import { BeforeYouStart } from "./BeforeYouStart";
import { DOWNLOAD_BOXES, DOWNLOAD_HEADING } from "./trustCopy";

export type PreviewForm = {
  slug: string;
  title: string;
  pages: string[];
};

type FormPreviewProps = {
  forms: PreviewForm[];
  notes: string[];
  loading: boolean;
  downloading: boolean;
  acks: boolean[];
  onToggle: (index: number, checked: boolean) => void;
  onDownload: () => void;
};

export function FormPreview({
  forms,
  notes,
  loading,
  downloading,
  acks,
  onToggle,
  onDownload,
}: FormPreviewProps) {
  const ready = acks.every(Boolean);

  return (
    <div className="flex max-h-[78vh] flex-col gap-6 overflow-y-auto pr-1">
      <div className="space-y-6">
        {loading ? (
          <p className="text-sm" role="status">
            Preparing preview
          </p>
        ) : null}
        {forms.map((form) => (
          <section key={form.slug} className="space-y-3">
            <h3 className="text-sm font-medium">{form.title}</h3>
            {form.pages.map((page, index) => (
              <div
                key={`${form.slug}-${index}`}
                role="img"
                aria-label={`${form.title} page ${index + 1}`}
                className="aspect-[8.5/11] w-full rounded-md border border-border bg-white bg-contain bg-top bg-no-repeat"
                style={{ backgroundImage: `url("data:image/jpeg;base64,${page}")` }}
              />
            ))}
          </section>
        ))}
        {notes.map((note) => (
          <p key={note} className="text-sm leading-6 text-muted-foreground">
            {note}
          </p>
        ))}
      </div>
      <BeforeYouStart heading={false} />
      <div>
        <h2 className="type-title text-[1.5rem]">{DOWNLOAD_HEADING}</h2>
        <p className="mt-3 text-sm leading-6">
          These forms were filled in from the answers <strong>you</strong> gave. AOS did not review them for legal accuracy.
        </p>
        <ul className="mt-4 space-y-3">
          {DOWNLOAD_BOXES.map((label, index) => (
            <li key={label}>
              <label className="flex items-start gap-3 text-sm leading-6">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={acks[index] ?? false}
                  onChange={(event) => onToggle(index, event.target.checked)}
                />
                <span>{label}</span>
              </label>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm leading-6">
          <span className="font-medium">About the &quot;preparer&quot; section:</span> USCIS forms have a section for anyone who helped <em>prepare</em> the form. AOS leaves it blank. Read the USCIS instructions for that section and complete it truthfully if anyone helped you.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button
            type="button"
            className="inline-flex h-12 items-center gap-2 rounded-md bg-primary px-6 text-base font-medium text-primary-foreground disabled:opacity-40"
            disabled={!ready || downloading || loading}
            onClick={onDownload}
          >
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download my forms (PDF)
          </button>
          <Link href="/start" className="text-sm underline decoration-foreground/30 underline-offset-4">
            Talk to an attorney first
          </Link>
        </div>
      </div>
    </div>
  );
}
