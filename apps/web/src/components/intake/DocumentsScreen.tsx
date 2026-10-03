"use client";

import { documentSlots } from "@/app/lib/intake/documents";
import type { Intake } from "@/app/lib/intake/schema";
import { LoadingState } from "@/components/system/States";
import { DemoBanner } from "./DemoBanner";
import { useIntake } from "./IntakeProvider";

function withFile(intake: Intake, slot: string, fileName: string): Intake {
  return {
    ...intake,
    documents: [
      ...intake.documents.filter((item) => item.slot !== slot),
      {
        slot,
        status: "uploaded",
        fileName,
        uploadedAt: new Date().toISOString(),
        note: "",
      },
    ],
  };
}

export function DocumentsScreen() {
  const { intake, ready, update } = useIntake();
  if (!ready) return <LoadingState label="Loading your answers" />;
  const slots = documentSlots(intake);

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8">
      <DemoBanner />
      <div>
        <h1 className="type-title">Documents</h1>
        <p className="mt-2 text-sm leading-6">
          The list follows your answers. Only the file name is kept. AOS does not send the file to USCIS.
        </p>
      </div>
      <ul className="flex flex-col gap-3">
        {slots.map((slot) => {
          const saved = intake.documents.find((item) => item.slot === slot.slot && item.fileName);
          return (
            <li key={slot.slot} className="rounded-lg border border-border px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-sm font-medium">{slot.title}</h2>
                <p className="text-xs text-foreground/60">{slot.required ? "Required" : "Optional"}</p>
              </div>
              <p className="mt-1 text-sm text-foreground/70">{slot.why}</p>
              <p className="mt-1 text-xs text-foreground/60">{slot.forms.join(", ")}</p>
              {saved ? (
                <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                  <p>{saved.fileName}</p>
                  <button
                    type="button"
                    className="underline decoration-foreground/30 underline-offset-4"
                    onClick={() =>
                      update({
                        ...intake,
                        documents: intake.documents.filter((item) => item.slot !== slot.slot),
                      })
                    }
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="mt-3 block text-sm">
                  <span className="underline decoration-foreground/30 underline-offset-4">Choose a file</span>
                  <input
                    className="sr-only"
                    type="file"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) update(withFile(intake, slot.slot, file.name));
                    }}
                  />
                </label>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
