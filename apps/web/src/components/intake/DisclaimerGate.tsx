"use client";

import Link from "next/link";
import { useState } from "react";
import { LoadingState } from "@/components/system/States";
import { BeforeYouStart } from "./BeforeYouStart";
import { START_CHECKBOX } from "./trustCopy";
import { useIntake } from "./IntakeProvider";

export function DisclaimerGate({ children }: { children: React.ReactNode }) {
  const { intake, ready, update } = useIntake();
  const [checked, setChecked] = useState(false);

  if (!ready) return <LoadingState label="Loading your answers" />;
  if (intake.disclaimerAckAt) return children;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-background/80 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ack-title"
        className="my-4 w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-lg"
      >
        <BeforeYouStart />
        <label className="mt-5 flex items-start gap-3 text-sm leading-6">
          <input
            className="mt-1"
            type="checkbox"
            checked={checked}
            onChange={(event) => setChecked(event.target.checked)}
          />
          <span>{START_CHECKBOX}</span>
        </label>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <button
            type="button"
            className="inline-flex h-12 items-center rounded-md bg-primary px-6 text-base font-medium text-primary-foreground disabled:opacity-40"
            disabled={!checked}
            onClick={() => update({ ...intake, disclaimerAckAt: new Date().toISOString() })}
          >
            Continue
          </button>
          <Link href="/start" className="text-sm underline decoration-foreground/30 underline-offset-4">
            Find legal help instead
          </Link>
        </div>
      </div>
    </div>
  );
}
