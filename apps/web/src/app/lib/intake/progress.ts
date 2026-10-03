import { checkIntake } from "./checks";
import type { FormId, Intake } from "./schema";

export type SectionProgress = {
  id: string;
  label: string;
  href: string;
  complete: boolean;
};

function named(person: { givenName: string; familyName: string }): boolean {
  return person.givenName.trim() !== "" && person.familyName.trim() !== "";
}

function dated(date: { month: string; day: string; year: string }): boolean {
  return date.month !== "" && date.day.trim() !== "" && date.year.trim() !== "";
}

function needs(intake: Intake, forms: readonly FormId[]): boolean {
  if (intake.selectedForms.length === 0) return false;
  return forms.some((form) => intake.selectedForms.includes(form));
}

export function sectionProgress(intake: Intake, asOf: Date): SectionProgress[] {
  const issues = checkIntake(intake, asOf);
  const issueHrefs = new Set(issues.map((issue) => issue.href));
  const sections: SectionProgress[] = [];

  const push = (section: SectionProgress) => {
    sections.push({
      ...section,
      complete: section.complete && !issueHrefs.has(section.href),
    });
  };

  push({
    id: "forms",
    label: "Forms",
    href: "/start",
    complete: intake.selectedForms.length > 0,
  });
  push({
    id: "petitioner",
    label: "Petitioner",
    href: "/sections/petitioner",
    complete:
      named(intake.petitioner) &&
      dated(intake.petitioner.dateOfBirth) &&
      intake.petitioner.citizenship !== "",
  });
  push({
    id: "beneficiary",
    label: "Beneficiary",
    href: "/sections/beneficiary",
    complete: named(intake.beneficiary) && dated(intake.beneficiary.dateOfBirth),
  });
  push({
    id: "marriage",
    label: "Marriage",
    href: "/sections/marital",
    complete: dated(intake.marriage.date) && intake.marriage.city.trim() !== "",
  });

  for (const role of ["petitioner", "beneficiary"] as const) {
    const title = role === "petitioner" ? "Petitioner" : "Beneficiary";
    push({
      id: `${role}-address`,
      label: `${title} addresses`,
      href: `/sections/${role}/address`,
      complete: intake.addresses.some(
        (row) => row.personRole === role && row.kind === "physical" && row.street.trim() !== "",
      ),
    });
    push({
      id: `${role}-employment`,
      label: `${title} employment`,
      href: `/sections/${role}/employment`,
      complete: intake.employment.some(
        (row) => row.personRole === role && row.fromMonth !== "" && row.fromYear.trim() !== "",
      ),
    });
  }

  if (needs(intake, ["i-485", "i-765", "i-131"])) {
    push({
      id: "eligibility",
      label: "Eligibility questions",
      href: "/sections/eligibility",
      complete: intake.eligibility.every((item) => item.answer !== "unanswered"),
    });
  }

  if (needs(intake, ["i-864"])) {
    push({
      id: "sponsor",
      label: "Sponsor",
      href: "/sections/sponsor",
      complete:
        intake.sponsor.householdSize.trim() !== "" &&
        intake.sponsor.currentIncome.trim() !== "",
    });
  }

  return sections;
}

export function reviewUnlocked(intake: Intake, asOf: Date): boolean {
  const sections = sectionProgress(intake, asOf);
  return (
    intake.selectedForms.length > 0 &&
    checkIntake(intake, asOf).length === 0 &&
    sections.every((section) => section.complete)
  );
}
