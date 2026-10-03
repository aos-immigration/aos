import type { Intake, IntakeAddress, IntakeEmployment, PersonRole } from "./schema";

export type IntakeIssue = {
  id: string;
  summary: string;
  href: string;
};

const US_COUNTRIES = new Set(["united states", "usa", "us"]);

function monthIndex(year: string, month: string): number | null {
  if (!/^\d{4}$/.test(year) || !/^\d{2}$/.test(month)) return null;
  const monthNumber = Number(month);
  if (monthNumber < 1 || monthNumber > 12) return null;
  return Number(year) * 12 + (monthNumber - 1);
}

function asOfIndex(asOf: Date): number {
  return asOf.getFullYear() * 12 + asOf.getMonth();
}

function calendarDayInvalid(year: string, month: string, day: string): boolean {
  if (!year && !month && !day) return false;
  if (!/^\d{4}$/.test(year) || !/^\d{2}$/.test(month) || !/^\d{2}$/.test(day)) {
    return true;
  }
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  );
}

type Span = { id: string; start: number; end: number; explanation: string };

function addressSpans(rows: IntakeAddress[], asOf: Date): Span[] {
  const endDefault = asOfIndex(asOf);
  const spans: Span[] = [];
  for (const row of rows) {
    if (row.kind !== "physical") continue;
    const start = monthIndex(row.startYear, row.startMonth);
    if (start === null) continue;
    const end = row.isCurrent
      ? endDefault
      : monthIndex(row.endYear, row.endMonth);
    if (end === null || end < start) continue;
    spans.push({
      id: row.id,
      start,
      end,
      explanation: row.gapExplanation.trim(),
    });
  }
  return spans.sort((a, b) => a.start - b.start);
}

function employmentSpans(rows: IntakeEmployment[], asOf: Date): Span[] {
  const endDefault = asOfIndex(asOf);
  const spans: Span[] = [];
  for (const row of rows) {
    const start = monthIndex(row.fromYear, row.fromMonth);
    if (start === null) continue;
    const end = row.isCurrent ? endDefault : monthIndex(row.toYear, row.toMonth);
    if (end === null || end < start) continue;
    spans.push({
      id: row.id,
      start,
      end,
      explanation: row.gapExplanation.trim(),
    });
  }
  return spans.sort((a, b) => a.start - b.start);
}

function historyIssues(
  spans: Span[],
  asOf: Date,
  href: string,
  label: string,
): IntakeIssue[] {
  if (spans.length === 0) return [];
  const issues: IntakeIssue[] = [];
  const windowStart = asOfIndex(asOf) - 60;
  const windowEnd = asOfIndex(asOf);

  for (let i = 0; i < spans.length; i += 1) {
    const current = spans[i];
    const next = spans[i + 1];
    if (!current || !next) continue;
    if (current.end >= next.start) {
      issues.push({
        id: `${label}-overlap-${current.id}-${next.id}`,
        summary: `${label} dates overlap. USCIS asks for dates that do not cover the same month twice.`,
        href,
      });
    } else if (next.start > current.end + 1 && next.explanation === "") {
      issues.push({
        id: `${label}-gap-${current.id}-${next.id}`,
        summary: `${label} has a gap. Add the missing period or explain it.`,
        href,
      });
    }
  }

  const first = spans[0];
  const last = spans[spans.length - 1];
  if (first && first.start > windowStart && first.explanation === "") {
    issues.push({
      id: `${label}-coverage-start-${first.id}`,
      summary: `${label} does not cover the last 5 years. Add the earlier period or explain it.`,
      href,
    });
  }
  if (last && last.end < windowEnd) {
    issues.push({
      id: `${label}-coverage-end-${last.id}`,
      summary: `${label} stops before the current month.`,
      href,
    });
  }
  return issues;
}

function personHistory(
  intake: Intake,
  role: PersonRole,
  asOf: Date,
): IntakeIssue[] {
  const href =
    role === "petitioner"
      ? "/sections/petitioner/address"
      : "/sections/beneficiary/address";
  const jobHref =
    role === "petitioner"
      ? "/sections/petitioner/employment"
      : "/sections/beneficiary/employment";
  const label = role === "petitioner" ? "Petitioner address history" : "Beneficiary address history";
  const jobLabel = role === "petitioner" ? "Petitioner employment" : "Beneficiary employment";
  return [
    ...historyIssues(
      addressSpans(
        intake.addresses.filter((row) => row.personRole === role),
        asOf,
      ),
      asOf,
      href,
      label,
    ),
    ...historyIssues(
      employmentSpans(
        intake.employment.filter((row) => row.personRole === role),
        asOf,
      ),
      asOf,
      jobHref,
      jobLabel,
    ),
  ];
}

function currentPhysical(intake: Intake, role: PersonRole): IntakeAddress | undefined {
  return intake.addresses.find(
    (row) => row.personRole === role && row.kind === "physical" && row.isCurrent && row.street.trim(),
  );
}

export function checkIntake(intake: Intake, asOf: Date): IntakeIssue[] {
  const issues: IntakeIssue[] = [];

  for (const [role, person] of [
    ["petitioner", intake.petitioner],
    ["beneficiary", intake.beneficiary],
  ] as const) {
    const dob = person.dateOfBirth;
    if (calendarDayInvalid(dob.year, dob.month, dob.day)) {
      issues.push({
        id: `${role}-dob`,
        summary: `${role === "petitioner" ? "Petitioner" : "Beneficiary"} date of birth is not a real calendar date.`,
        href: role === "petitioner" ? "/sections/petitioner" : "/sections/beneficiary",
      });
    }
    if (person.ssn.trim() && !/^\d{3}-\d{2}-\d{4}$/.test(person.ssn.trim())) {
      issues.push({
        id: `${role}-ssn`,
        summary: "Enter the Social Security number as 000-00-0000, or leave it blank.",
        href: role === "petitioner" ? "/sections/petitioner" : "/sections/beneficiary",
      });
    }
    if (person.aNumber.trim() && !/^A?\d{7,9}$/i.test(person.aNumber.trim())) {
      issues.push({
        id: `${role}-anumber`,
        summary: "Enter the A-Number as the letter A plus 7 to 9 digits, or leave it blank.",
        href: role === "petitioner" ? "/sections/petitioner" : "/sections/beneficiary",
      });
    }
  }

  const marriage = intake.marriage.date;
  const marriageIndex = monthIndex(marriage.year, marriage.month);
  if (
    (marriage.year || marriage.month || marriage.day) &&
    calendarDayInvalid(marriage.year, marriage.month, marriage.day)
  ) {
    issues.push({
      id: "marriage-date",
      summary: "Marriage date is not a real calendar date.",
      href: "/sections/marital",
    });
  }

  for (const prior of intake.priorMarriages) {
    const end = monthIndex(prior.endYear, prior.endMonth);
    if (marriageIndex !== null && end !== null && end > marriageIndex) {
      issues.push({
        id: `prior-after-marriage-${prior.id}`,
        summary: "A prior marriage ends after the current marriage date.",
        href: "/sections/marital",
      });
    }
  }

  if (intake.marriage.liveTogether === "yes") {
    const petitionerHome = currentPhysical(intake, "petitioner");
    const beneficiaryHome = currentPhysical(intake, "beneficiary");
    if (petitionerHome && beneficiaryHome) {
      const same =
        petitionerHome.street.trim().toLowerCase() === beneficiaryHome.street.trim().toLowerCase() &&
        petitionerHome.city.trim().toLowerCase() === beneficiaryHome.city.trim().toLowerCase() &&
        petitionerHome.postal.trim() === beneficiaryHome.postal.trim();
      if (!same) {
        issues.push({
          id: "live-together-address",
          summary: "You said you live together, and the current addresses differ.",
          href: "/sections/beneficiary/address",
        });
      }
    }
  }

  for (const row of intake.addresses) {
    const country = row.country.trim().toLowerCase();
    if (
      row.postal.trim() &&
      US_COUNTRIES.has(country) &&
      !/^\d{5}(-\d{4})?$/.test(row.postal.trim())
    ) {
      issues.push({
        id: `postal-${row.id}`,
        summary: "US ZIP codes are 5 digits. Foreign postal codes can be letters.",
        href:
          row.personRole === "petitioner"
            ? "/sections/petitioner/address"
            : "/sections/beneficiary/address",
      });
    }
  }

  issues.push(...personHistory(intake, "petitioner", asOf));
  issues.push(...personHistory(intake, "beneficiary", asOf));
  return issues;
}
