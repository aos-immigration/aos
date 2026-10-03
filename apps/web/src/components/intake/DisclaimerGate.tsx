"use client";

import Link from "next/link";
import { useState } from "react";
import { LoadingState } from "@/components/system/States";
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
        <h2 id="ack-title" className="type-title text-[1.5rem]">
          Before you start
        </h2>
        <p className="mt-4 text-sm font-medium leading-6">
          AOS is self-help software. It is not a law firm, and it is not a substitute for the advice of an attorney.
        </p>
        <ul className="mt-4 space-y-3 text-sm leading-6">
          <li>
            <span className="font-medium">No legal advice.</span> AOS gives general information taken from official USCIS instructions and copies the answers you type into the USCIS forms you choose. AOS does not tell you whether you qualify, which forms to file, or how to answer a question about your situation.
          </li>
          <li>
            <span className="font-medium">No attorney-client relationship.</span> Using AOS does not make AOS or anyone at AOS your lawyer or representative. Nobody at AOS will sign your forms as your representative or contact USCIS for you.
          </li>
          <li>
            <span className="font-medium">You&apos;re in charge.</span> You choose your forms, you give every answer, and you&apos;re responsible for checking that everything is true and complete before you sign and file.
          </li>
          <li>
            <span className="font-medium">Not the government.</span> AOS is not affiliated with, endorsed by, or connected to USCIS, the Department of Homeland Security, or any government agency. Blank forms and instructions are free at{" "}
            <a className="underline decoration-foreground/30 underline-offset-4" href="https://www.uscis.gov/forms">
              uscis.gov/forms
            </a>
            , and you don&apos;t need AOS to file.
          </li>
          <li>
            <span className="font-medium">Some situations need a lawyer.</span> If any of the items in our{" "}
            <Link className="underline decoration-foreground/30 underline-offset-4" href="/start">
              &quot;Talk to an attorney first&quot; list
            </Link>{" "}
            apply to you, please talk to a licensed immigration attorney or a DOJ-accredited representative before filing.
          </li>
        </ul>
        <label className="mt-5 flex items-start gap-3 text-sm leading-6">
          <input
            className="mt-1"
            type="checkbox"
            checked={checked}
            onChange={(event) => setChecked(event.target.checked)}
          />
          <span>
            I understand that AOS is not a law firm, does not give legal advice, and is not a substitute for the advice of an attorney.
          </span>
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
