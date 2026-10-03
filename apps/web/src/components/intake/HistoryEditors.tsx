"use client";

import Link from "next/link";
import { checkIntake } from "@/app/lib/intake/checks";
import { addressBars, employmentBars } from "@/app/lib/intake/timeline";
import type { Intake, IntakeAddress, IntakeEmployment, PersonRole } from "@/app/lib/intake/schema";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoadingState } from "@/components/system/States";
import { DemoBanner } from "./DemoBanner";
import { HistoryTrack } from "./HistoryTrack";
import { useIntake } from "./IntakeProvider";

const MONTHS = ["", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];

function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function blankAddress(role: PersonRole): IntakeAddress {
  return {
    id: newId("addr"),
    personRole: role,
    kind: "physical",
    street: "",
    unitType: "",
    unit: "",
    city: "",
    state: "",
    province: "",
    postal: "",
    country: "",
    startMonth: "",
    startYear: "",
    endMonth: "",
    endYear: "",
    isCurrent: true,
    gapExplanation: "",
  };
}

function blankJob(role: PersonRole): IntakeEmployment {
  return {
    id: newId("job"),
    personRole: role,
    status: "",
    employerName: "",
    jobTitle: "",
    city: "",
    state: "",
    country: "",
    fromMonth: "",
    fromYear: "",
    toMonth: "",
    toYear: "",
    isCurrent: true,
    gapExplanation: "",
  };
}

export function AddressHistoryEditor({
  role,
  title,
  nextHref,
}: {
  role: PersonRole;
  title: string;
  nextHref: string;
}) {
  const { intake, ready, update } = useIntake();
  if (!ready) return <LoadingState label="Loading your answers" />;
  const rows = intake.addresses.filter((row) => row.personRole === role && row.kind === "physical");
  const href = `/sections/${role}/address`;
  const issues = checkIntake(intake, new Date()).filter((issue) => issue.href === href);

  const replace = (row: IntakeAddress) => {
    update({
      ...intake,
      addresses: intake.addresses.map((item) => (item.id === row.id ? row : item)),
    });
  };

  return (
    <section className="mx-auto flex max-w-xl flex-col gap-6">
      <DemoBanner />
      <h1 className="type-title">{title}</h1>
      <p className="text-sm leading-6">
        List every physical address for the last five years. A gap needs a short explanation.
      </p>
      <HistoryTrack title="Address timeline" bars={addressBars(intake.addresses, role, new Date())} />
      {issues.map((issue) => (
        <p key={issue.id} className="text-sm text-destructive" role="alert">
          {issue.summary}
        </p>
      ))}
      {rows.map((row) => (
        <fieldset key={row.id} className="space-y-3 rounded-lg border border-border p-4">
          <Text label="Street" value={row.street} onChange={(street) => replace({ ...row, street })} />
          <div className="grid grid-cols-2 gap-3">
            <Text label="City" value={row.city} onChange={(city) => replace({ ...row, city })} />
            <Text label="State" value={row.state} onChange={(state) => replace({ ...row, state })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Text label="Postal code" value={row.postal} onChange={(postal) => replace({ ...row, postal })} />
            <Text label="Country" value={row.country} onChange={(country) => replace({ ...row, country })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Month label="From month" value={row.startMonth} onChange={(startMonth) => replace({ ...row, startMonth })} />
            <Text label="From year" value={row.startYear} onChange={(startYear) => replace({ ...row, startYear })} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={row.isCurrent}
              onChange={(event) => replace({ ...row, isCurrent: event.target.checked })}
            />
            Current address
          </label>
          {row.isCurrent ? null : (
            <div className="grid grid-cols-2 gap-3">
              <Month label="To month" value={row.endMonth} onChange={(endMonth) => replace({ ...row, endMonth })} />
              <Text label="To year" value={row.endYear} onChange={(endYear) => replace({ ...row, endYear })} />
            </div>
          )}
          <Text
            label="Gap explanation, if the previous address does not meet this one"
            value={row.gapExplanation}
            onChange={(gapExplanation) => replace({ ...row, gapExplanation })}
          />
          <button
            type="button"
            className="text-sm underline decoration-foreground/30 underline-offset-4"
            onClick={() =>
              update({ ...intake, addresses: intake.addresses.filter((item) => item.id !== row.id) })
            }
          >
            Remove this address
          </button>
        </fieldset>
      ))}
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          className="text-sm underline decoration-foreground/30 underline-offset-4"
          onClick={() => update({ ...intake, addresses: [...intake.addresses, blankAddress(role)] })}
        >
          Add an address
        </button>
        <Link href={nextHref} className={buttonVariants({ size: "cta" })}>
          Next
        </Link>
      </div>
    </section>
  );
}

export function EmploymentHistoryEditor({
  role,
  title,
  nextHref,
}: {
  role: PersonRole;
  title: string;
  nextHref: string;
}) {
  const { intake, ready, update } = useIntake();
  if (!ready) return <LoadingState label="Loading your answers" />;
  const rows = intake.employment.filter((row) => row.personRole === role);
  const href = `/sections/${role}/employment`;
  const issues = checkIntake(intake, new Date()).filter((issue) => issue.href === href);
  const replace = (row: IntakeEmployment) => {
    update({
      ...intake,
      employment: intake.employment.map((item) => (item.id === row.id ? row : item)),
    });
  };

  return (
    <section className="mx-auto flex max-w-xl flex-col gap-6">
      <DemoBanner />
      <h1 className="type-title">{title}</h1>
      <p className="text-sm leading-6">List work, school, and unemployment for the last five years.</p>
      <HistoryTrack title="Employment timeline" bars={employmentBars(intake.employment, role, new Date())} />
      {issues.map((issue) => (
        <p key={issue.id} className="text-sm text-destructive" role="alert">
          {issue.summary}
        </p>
      ))}
      {rows.map((row) => (
        <fieldset key={row.id} className="space-y-3 rounded-lg border border-border p-4">
          <label className="block space-y-2 text-sm">
            <span className="font-medium">Status</span>
            <select
              className="h-12 w-full rounded-md border border-input bg-transparent px-3"
              value={row.status}
              onChange={(event) =>
                replace({ ...row, status: event.target.value as IntakeEmployment["status"] })
              }
            >
              <option value="">Choose</option>
              <option value="employed">Employed</option>
              <option value="unemployed">Unemployed</option>
              <option value="student">Student</option>
              <option value="other">Other</option>
            </select>
          </label>
          <Text label="Employer or school" value={row.employerName} onChange={(employerName) => replace({ ...row, employerName })} />
          <Text label="Occupation" value={row.jobTitle} onChange={(jobTitle) => replace({ ...row, jobTitle })} />
          <div className="grid grid-cols-2 gap-3">
            <Month label="From month" value={row.fromMonth} onChange={(fromMonth) => replace({ ...row, fromMonth })} />
            <Text label="From year" value={row.fromYear} onChange={(fromYear) => replace({ ...row, fromYear })} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={row.isCurrent}
              onChange={(event) => replace({ ...row, isCurrent: event.target.checked })}
            />
            Current
          </label>
          <Text
            label="Gap explanation, if needed"
            value={row.gapExplanation}
            onChange={(gapExplanation) => replace({ ...row, gapExplanation })}
          />
          <button
            type="button"
            className="text-sm underline decoration-foreground/30 underline-offset-4"
            onClick={() =>
              update({ ...intake, employment: intake.employment.filter((item) => item.id !== row.id) })
            }
          >
            Remove
          </button>
        </fieldset>
      ))}
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          className="text-sm underline decoration-foreground/30 underline-offset-4"
          onClick={() => update({ ...intake, employment: [...intake.employment, blankJob(role)] })}
        >
          Add employment
        </button>
        <Link href={nextHref} className={buttonVariants({ size: "cta" })}>
          Next
        </Link>
      </div>
    </section>
  );
}

export function PriorMarriages({
  intake,
  onChange,
}: {
  intake: Intake;
  onChange: (next: Intake) => void;
}) {
  const add = (personRole: PersonRole) => {
    onChange({
      ...intake,
      priorMarriages: [
        ...intake.priorMarriages,
        {
          id: newId("prior"),
          personRole,
          spouseGiven: "",
          spouseFamily: "",
          startMonth: "",
          startYear: "",
          endMonth: "",
          endYear: "",
          howEnded: "",
        },
      ],
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm leading-6">Leave this empty if neither spouse was married before.</p>
      {intake.priorMarriages.map((row) => (
        <fieldset key={row.id} className="space-y-3 rounded-lg border border-border p-4">
          <p className="text-sm font-medium">
            {row.personRole === "petitioner" ? "Petitioner" : "Beneficiary"}
          </p>
          <Text
            label="Former spouse given name"
            value={row.spouseGiven}
            onChange={(spouseGiven) =>
              onChange({
                ...intake,
                priorMarriages: intake.priorMarriages.map((item) =>
                  item.id === row.id ? { ...item, spouseGiven } : item,
                ),
              })
            }
          />
          <Text
            label="Former spouse family name"
            value={row.spouseFamily}
            onChange={(spouseFamily) =>
              onChange({
                ...intake,
                priorMarriages: intake.priorMarriages.map((item) =>
                  item.id === row.id ? { ...item, spouseFamily } : item,
                ),
              })
            }
          />
          <div className="grid grid-cols-2 gap-3">
            <Month
              label="Ended month"
              value={row.endMonth}
              onChange={(endMonth) =>
                onChange({
                  ...intake,
                  priorMarriages: intake.priorMarriages.map((item) =>
                    item.id === row.id ? { ...item, endMonth } : item,
                  ),
                })
              }
            />
            <Text
              label="Ended year"
              value={row.endYear}
              onChange={(endYear) =>
                onChange({
                  ...intake,
                  priorMarriages: intake.priorMarriages.map((item) =>
                    item.id === row.id ? { ...item, endYear } : item,
                  ),
                })
              }
            />
          </div>
          <label className="block space-y-2 text-sm">
            <span className="font-medium">How it ended</span>
            <select
              className="h-12 w-full rounded-md border border-input bg-transparent px-3"
              value={row.howEnded}
              onChange={(event) =>
                onChange({
                  ...intake,
                  priorMarriages: intake.priorMarriages.map((item) =>
                    item.id === row.id
                      ? { ...item, howEnded: event.target.value as typeof item.howEnded }
                      : item,
                  ),
                })
              }
            >
              <option value="">Choose</option>
              <option value="divorce">Divorce</option>
              <option value="annulment">Annulment</option>
              <option value="death">Death</option>
              <option value="other">Other</option>
            </select>
          </label>
          <button
            type="button"
            className="text-sm underline decoration-foreground/30 underline-offset-4"
            onClick={() =>
              onChange({
                ...intake,
                priorMarriages: intake.priorMarriages.filter((item) => item.id !== row.id),
              })
            }
          >
            Remove
          </button>
        </fieldset>
      ))}
      <div className="flex flex-wrap gap-4">
        <button type="button" className="text-sm underline" onClick={() => add("petitioner")}>
          Add a petitioner marriage
        </button>
        <button type="button" className="text-sm underline" onClick={() => add("beneficiary")}>
          Add a beneficiary marriage
        </button>
      </div>
    </div>
  );
}

function Text({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-2 text-sm">
      <span className="font-medium">{label}</span>
      <Input className="h-12 text-base" value={value} autoComplete="off" onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Month({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: IntakeAddress["startMonth"]) => void;
}) {
  return (
    <label className="block space-y-2 text-sm">
      <span className="font-medium">{label}</span>
      <select
        className="h-12 w-full rounded-md border border-input bg-transparent px-3"
        value={value}
        onChange={(event) => onChange(event.target.value as IntakeAddress["startMonth"])}
      >
        {MONTHS.map((month) => (
          <option key={month || "blank"} value={month}>
            {month || "Month"}
          </option>
        ))}
      </select>
    </label>
  );
}
