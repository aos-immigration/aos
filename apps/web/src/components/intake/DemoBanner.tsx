"use client";

import { useIntake } from "./IntakeProvider";

export function DemoBanner() {
  const { intake, clear } = useIntake();
  if (intake.source !== "demo") return null;
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-accent px-4 py-3 text-sm">
      <p>Fictional sample data only. Jordan Sampleton and Avery Exampleton are not real people.</p>
      <button type="button" className="underline decoration-foreground/40 underline-offset-4" onClick={clear}>
        Clear demo data
      </button>
    </div>
  );
}
