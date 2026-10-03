"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChoiceCard } from "@/components/system/ChoiceCard";
import { QuestionFrame } from "@/components/system/QuestionFrame";
import { ErrorState, LoadingState } from "@/components/system/States";
import { Input } from "@/components/ui/input";
import { checkIntake } from "@/app/lib/intake/checks";
import { readPath, writePath } from "@/app/lib/intake/path";
import type { Intake } from "@/app/lib/intake/schema";
import type { Step } from "@/app/lib/intake/steps";
import { DemoBanner } from "./DemoBanner";
import { PriorMarriages } from "./HistoryEditors";
import { useIntake } from "./IntakeProvider";

const MONTHS = [
  ["", "Month"],
  ["01", "January"],
  ["02", "February"],
  ["03", "March"],
  ["04", "April"],
  ["05", "May"],
  ["06", "June"],
  ["07", "July"],
  ["08", "August"],
  ["09", "September"],
  ["10", "October"],
  ["11", "November"],
  ["12", "December"],
] as const;

type QuestionRunProps = {
  steps: readonly Step[];
  href: string;
  doneHref: string;
};

function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function QuestionRun({ steps, href, doneHref }: QuestionRunProps) {
  const router = useRouter();
  const { intake, ready, status, error, update } = useIntake();
  const [index, setIndex] = useState(0);
  const step = steps[Math.min(index, steps.length - 1)];
  const issues = checkIntake(intake, new Date()).filter((issue) => issue.href === href);

  if (!ready) return <LoadingState label="Loading your answers" />;
  if (!step) return null;

  const saveNote =
    status === "saving" ? "Saving" : status === "saved" ? "Saved" : status === "error" ? error ?? "Could not save your answers." : undefined;

  const goNext = () => {
    if (index < steps.length - 1) {
      setIndex(index + 1);
      return;
    }
    router.push(doneHref);
  };

  return (
    <div>
      <DemoBanner />
      {error && status === "error" ? <ErrorState message={error} /> : null}
      <QuestionFrame
        index={index + 1}
        total={steps.length}
        title={step.title}
        why={step.why}
        note={saveNote}
        nextLabel={index === steps.length - 1 ? "Continue" : "Next"}
        onNext={goNext}
        onBack={index > 0 ? () => setIndex(index - 1) : undefined}
      >
        <StepBody
          step={step}
          intake={intake}
          onChange={(next, advance) => {
            update(next);
            if (advance && index < steps.length - 1) setIndex(index + 1);
          }}
        />
        {issues.length > 0 ? (
          <ul className="space-y-2">
            {issues.map((issue) => (
              <li key={issue.id} className="text-sm text-destructive">
                {issue.summary}
              </li>
            ))}
          </ul>
        ) : null}
      </QuestionFrame>
    </div>
  );
}

function StepBody({
  step,
  intake,
  onChange,
}: {
  step: Step;
  intake: Intake;
  onChange: (next: Intake, advance: boolean) => void;
}) {
  if (step.kind === "fields") {
    return (
      <div className="space-y-4">
        {step.fields.map((field) => (
          <FieldControl
            key={field.path}
            label={field.label}
            value={asText(readPath(intake, field.path))}
            sensitive={field.sensitive}
            type={field.input ?? "text"}
            onValue={(value) => onChange(writePath(intake, field.path, value), false)}
          />
        ))}
      </div>
    );
  }

  if (step.kind === "date") {
    const date = readPath(intake, step.path) as { month?: string; day?: string; year?: string };
    const write = (part: "month" | "day" | "year", value: string) =>
      onChange(writePath(intake, `${step.path}.${part}`, value), false);
    return (
      <div className="grid grid-cols-3 gap-3">
        <label className="space-y-2 text-sm">
          <span className="font-medium">Month</span>
          <select
            className="h-12 w-full rounded-md border border-input bg-transparent px-3"
            value={date.month ?? ""}
            onChange={(event) => write("month", event.target.value)}
          >
            {MONTHS.map(([value, label]) => (
              <option key={value || "blank"} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <FieldControl label="Day" value={date.day ?? ""} onValue={(value) => write("day", value)} />
        <FieldControl label="Year" value={date.year ?? ""} onValue={(value) => write("year", value)} />
      </div>
    );
  }

  if (step.kind === "choice") {
    const selected = asText(readPath(intake, step.path));
    const explanationPath = step.path.replace(/\.answer$/, ".explanation");
    return (
      <div className="space-y-3">
        {step.options.map((option) => (
          <ChoiceCard
            key={option.value}
            title={option.title}
            definition={option.definition}
            selected={selected === option.value}
            onSelect={() => onChange(writePath(intake, step.path, option.value), step.advance)}
          />
        ))}
        {selected === "yes" && explanationPath !== step.path ? (
          <FieldControl
            label="Short explanation"
            value={asText(readPath(intake, explanationPath))}
            onValue={(value) => onChange(writePath(intake, explanationPath, value), false)}
          />
        ) : null}
      </div>
    );
  }

  if (step.kind === "multi") {
    const selected = readPath(intake, step.path);
    const values = Array.isArray(selected) ? selected.map(String) : [];
    return (
      <div className="space-y-3">
        {step.options.map((option) => (
          <ChoiceCard
            key={option.value}
            title={option.title}
            definition={option.definition || "Select if this applies."}
            selected={values.includes(option.value)}
            onSelect={() => {
              const next = values.includes(option.value)
                ? values.filter((value) => value !== option.value)
                : [...values, option.value];
              onChange(writePath(intake, step.path, next), false);
            }}
          />
        ))}
      </div>
    );
  }

  return <PriorMarriages intake={intake} onChange={(next) => onChange(next, false)} />;
}

function FieldControl({
  label,
  value,
  onValue,
  sensitive,
  type = "text",
}: {
  label: string;
  value: string;
  onValue: (value: string) => void;
  sensitive?: boolean;
  type?: "text" | "email" | "tel";
}) {
  const [shown, setShown] = useState(false);
  return (
    <label className="block space-y-2">
      <span className="flex items-center justify-between text-sm font-medium">
        {label}
        {sensitive ? (
          <button
            type="button"
            className="font-normal underline decoration-foreground/30 underline-offset-4"
            onClick={() => setShown((open) => !open)}
          >
            {shown ? "Hide" : "Show"}
          </button>
        ) : null}
      </span>
      <Input
        className="h-12 text-base"
        type={sensitive && !shown ? "password" : type}
        value={value}
        autoComplete="off"
        spellCheck={false}
        data-dd-privacy={sensitive ? "hidden" : undefined}
        onChange={(event) => onValue(event.target.value)}
      />
    </label>
  );
}
