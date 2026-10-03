"use client";

import { useState } from "react";
import { DISCLAIMER } from "@/components/system/copy";
import { LoadingState } from "@/components/system/States";
import { useIntake } from "./IntakeProvider";

export function DisclaimerGate({ children }: { children: React.ReactNode }) {
  const { intake, ready, update } = useIntake();
  const [checked, setChecked] = useState(false);

  if (!ready) return <LoadingState label="Loading your answers" />;
  if (intake.disclaimerAckAt) return children;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-4 sm:items-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ack-title"
          className="w-full max-w-lg rounded-lg border border-border bg-card p-6 shadow-lg"
        >
          <h2 id="ack-title" className="type-title text-[1.5rem]">
            Before you start
          </h2>
          <p className="mt-4 text-sm leading-6">{DISCLAIMER}</p>
          <label className="mt-5 flex items-start gap-3 text-sm leading-6">
            <input
              className="mt-1"
              type="checkbox"
              checked={checked}
              onChange={(event) => setChecked(event.target.checked)}
            />
            <span>I understand. AOS is not a law firm and is not a substitute for the advice of an attorney.</span>
          </label>
          <button
            type="button"
            className="mt-5 inline-flex h-12 items-center rounded-md bg-primary px-6 text-base font-medium text-primary-foreground disabled:opacity-40"
            disabled={!checked}
            onClick={() =>
              update({ ...intake, disclaimerAckAt: new Date().toISOString() })
            }
          >
            Continue
          </button>
        </div>
      </div>
  );
}
