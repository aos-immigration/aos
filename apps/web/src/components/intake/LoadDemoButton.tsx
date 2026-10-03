"use client";

import { useState } from "react";
import { intakeHasAnswers } from "@/app/lib/intake/answers";
import { useIntake } from "./IntakeProvider";

export function LoadDemoButton({ className }: { className?: string }) {
  const { intake, loadDemo } = useIntake();
  const [open, setOpen] = useState(false);

  const ask = () => {
    if (intakeHasAnswers(intake)) {
      setOpen(true);
      return;
    }
    loadDemo();
  };

  return (
    <>
      <button type="button" className={className} onClick={ask}>
        Load demo
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="load-demo-title"
            className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg"
          >
            <h2 id="load-demo-title" className="type-title text-[1.5rem]">
              Replace these answers?
            </h2>
            <p className="mt-3 text-sm leading-6">
              Load demo replaces the answers in this tab with the fictional Sampleton couple.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                className="inline-flex h-12 items-center rounded-md bg-primary px-6 text-base font-medium text-primary-foreground"
                onClick={() => {
                  setOpen(false);
                  loadDemo();
                }}
              >
                Load demo
              </button>
              <button
                type="button"
                className="text-sm underline decoration-foreground/30 underline-offset-4"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
