"use client";

import Link from "next/link";
import { sectionProgress } from "@/app/lib/intake/progress";
import { toggleForm } from "@/app/lib/intake/path";
import { FORM_IDS, type FormId } from "@/app/lib/intake/schema";
import { LoadingState } from "@/components/system/States";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DemoBanner } from "./DemoBanner";
import { LoadDemoButton } from "./LoadDemoButton";
import { useIntake } from "./IntakeProvider";

const FORM_LINES: Record<FormId, string> = {
  "i-130": "Petition for a relative",
  "i-130a": "Spouse details filed with the I-130",
  "i-485": "Green card application",
  "i-864": "Affidavit of support",
  "i-765": "Work permit",
  "i-131": "Travel document",
  "g-1145": "Text or email when USCIS accepts a form",
};

export function SectionsHome() {
  const { intake, ready, status, error, update } = useIntake();
  if (!ready) return <LoadingState label="Loading your answers" />;

  const sections = sectionProgress(intake, new Date());
  const next = sections.find((section) => !section.complete) ?? sections[0];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <DemoBanner />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="type-title">Your answers</h1>
          <p className="mt-2 max-w-xl text-sm leading-6">
            Choose the forms you want to prepare. Nothing is selected for you.
          </p>
        </div>
        <LoadDemoButton className={buttonVariants({ variant: "outline" })} />
      </div>
      <p className="text-sm" role="status">
        {status === "saving"
          ? "Saving"
          : status === "saved"
            ? "Saved"
            : status === "error"
              ? error
              : process.env.NEXT_PUBLIC_CONVEX_URL
                ? "Saved with this application."
                : "Kept while this tab stays open."}
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {FORM_IDS.map((form) => {
          const selected = intake.selectedForms.includes(form);
          return (
            <li key={form}>
              <button
                type="button"
                aria-pressed={selected}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md border border-border px-3 py-2 text-left",
                  selected && "border-foreground bg-accent",
                )}
                onClick={() => update(toggleForm(intake, form))}
              >
                <span
                  className={cn(
                    "size-4 shrink-0 rounded-sm border border-foreground",
                    selected && "bg-foreground",
                  )}
                  aria-hidden="true"
                />
                <span>
                  <span className="block text-sm font-medium uppercase">{form}</span>
                  <span className="block text-xs text-foreground/70">{FORM_LINES[form]}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <ol className="divide-y divide-border rounded-lg border border-border">
        {sections.map((section) => (
          <li key={section.id}>
            <Link href={section.href} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-accent">
              <span>{section.label}</span>
              <span className="text-foreground/70">{section.complete ? "Done" : "Open"}</span>
            </Link>
          </li>
        ))}
      </ol>
      {next && next.id !== "forms" ? (
        <Link href={next.href} className={buttonVariants({ size: "cta" })}>
          {next.complete ? "Review answers" : `Continue with ${next.label.toLowerCase()}`}
        </Link>
      ) : null}
    </div>
  );
}
