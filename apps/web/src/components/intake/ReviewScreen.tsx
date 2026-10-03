"use client";

import { checkIntake } from "@/app/lib/intake/checks";
import { reviewUnlocked, sectionProgress } from "@/app/lib/intake/progress";
import { addressBars, employmentBars } from "@/app/lib/intake/timeline";
import { LoadingState } from "@/components/system/States";
import { DemoBanner } from "./DemoBanner";
import { FixList } from "./FixList";
import { HistoryTrack } from "./HistoryTrack";
import { useIntake } from "./IntakeProvider";

function fact(label: string, value: string, source: string) {
  return { label, value: value.trim() || "Not answered", source };
}

export function ReviewScreen() {
  const { intake, ready } = useIntake();
  if (!ready) return <LoadingState label="Loading your answers" />;

  const asOf = new Date();
  const issues = checkIntake(intake, asOf);
  const unlocked = reviewUnlocked(intake, asOf);
  const openSections = sectionProgress(intake, asOf).filter((section) => !section.complete);
  const source = intake.source === "demo" ? "Fictional demo" : "Your answer";
  const facts = [
    fact("Petitioner", `${intake.petitioner.givenName} ${intake.petitioner.familyName}`, source),
    fact("Beneficiary", `${intake.beneficiary.givenName} ${intake.beneficiary.familyName}`, source),
    fact(
      "Marriage",
      [intake.marriage.date.month, intake.marriage.date.day, intake.marriage.date.year]
        .filter(Boolean)
        .join("/"),
      source,
    ),
    fact("Marriage city", intake.marriage.city, source),
  ];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <DemoBanner />
      <div>
        <h1 className="type-title">Review</h1>
        <p className="mt-2 max-w-xl text-sm leading-6">
          {unlocked
            ? "The automated check has nothing open. Preview the draft, then download it as a separate step."
            : "The automated check still has items open. Review stays locked until those are cleared and the required sections are filled."}
        </p>
      </div>
      <section className="space-y-3">
        <h2 className="text-sm font-medium">Automated check</h2>
        <FixList issues={issues} />
        {openSections.length > 0 ? (
          <ul className="text-sm leading-6">
            {openSections.map((section) => (
              <li key={section.id}>{section.label} is still open.</li>
            ))}
          </ul>
        ) : null}
      </section>
      <section className="grid gap-3 sm:grid-cols-3">
        <p className="rounded-md border border-border px-4 py-3 text-sm">Automated check</p>
        <p className="rounded-md border border-dashed border-border px-4 py-3 text-sm text-foreground/70">
          Specialist review, coming soon
        </p>
        <p className="rounded-md border border-dashed border-border px-4 py-3 text-sm text-foreground/70">
          Attorney review, coming soon
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-sm font-medium">Key facts</h2>
        <dl className="divide-y divide-border rounded-lg border border-border">
          {facts.map((item) => (
            <div key={item.label} className="grid gap-1 px-4 py-3 sm:grid-cols-[10rem_1fr_auto]">
              <dt className="text-sm text-foreground/70">{item.label}</dt>
              <dd className="text-sm">{item.value}</dd>
              <dd className="text-xs text-foreground/60">{item.source}</dd>
            </div>
          ))}
        </dl>
        {issues.length > 0 ? (
          <p className="text-sm">Conflicts are the open checks above. Each one links to the question that wrote it.</p>
        ) : null}
      </section>
      <HistoryTrack title="Petitioner addresses" bars={addressBars(intake.addresses, "petitioner", asOf)} />
      <HistoryTrack title="Beneficiary addresses" bars={addressBars(intake.addresses, "beneficiary", asOf)} />
      <HistoryTrack title="Petitioner employment" bars={employmentBars(intake.employment, "petitioner", asOf)} />
      <HistoryTrack title="Beneficiary employment" bars={employmentBars(intake.employment, "beneficiary", asOf)} />
    </div>
  );
}
