import type { Intake } from "./schema";

export type DocumentSlot = {
  slot: string;
  title: string;
  why: string;
  forms: string[];
  required: boolean;
};

export function documentSlots(intake: Intake): DocumentSlot[] {
  const slots: DocumentSlot[] = [
    {
      slot: "petitioner-photo-id",
      title: "Petitioner photo ID",
      why: "USCIS asks the petitioner for a photo identity document.",
      forms: ["I-130", "I-864"],
      required: true,
    },
    {
      slot: "beneficiary-passport",
      title: "Beneficiary passport",
      why: "The passport bio page is the identity document for the beneficiary.",
      forms: ["I-130", "I-485", "I-765", "I-131"],
      required: true,
    },
    {
      slot: "marriage-certificate",
      title: "Marriage certificate",
      why: "The petition is based on a marriage.",
      forms: ["I-130", "I-485"],
      required: true,
    },
  ];

  if (intake.priorMarriages.length > 0) {
    slots.push({
      slot: "divorce-decree",
      title: "Proof a prior marriage ended",
      why: "Because a prior marriage is listed.",
      forms: ["I-130", "I-485"],
      required: true,
    });
  }

  if (intake.selectedForms.includes("i-485")) {
    slots.push({
      slot: "i-94",
      title: "I-94 arrival record",
      why: "Form I-485 asks for the last arrival.",
      forms: ["I-485"],
      required: true,
    });
  }

  if (intake.selectedForms.includes("i-864")) {
    slots.push({
      slot: "tax-return",
      title: "Most recent tax return",
      why: "Form I-864 asks for tax information.",
      forms: ["I-864"],
      required: true,
    });
  }

  slots.push({
    slot: "relationship-photos",
    title: "Relationship photos",
    why: "Photos you choose to include. AOS does not score them.",
    forms: ["I-130"],
    required: false,
  });

  return slots;
}
