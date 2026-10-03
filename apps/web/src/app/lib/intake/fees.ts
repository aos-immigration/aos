import type { FormId } from "./schema";

export type FilingMethod = "paper" | "online";

export type FeeLine = {
  id: FormId;
  label: string;
  amount: number;
  source: string;
};

const SOURCE = "USCIS Form G-1055, edition 10/01/26";

const LINES: Record<FormId, { label: string; paper: number; online: number; source: string }> = {
  "i-130": {
    label: "Form I-130",
    paper: 675,
    online: 625,
    source: `${SOURCE}. Petition for Alien Relative, general filing.`,
  },
  "i-130a": {
    label: "Form I-130A",
    paper: 0,
    online: 0,
    source: `${SOURCE} has no separate I-130A fee. It is filed with Form I-130.`,
  },
  "i-485": {
    label: "Form I-485",
    paper: 1440,
    online: 1390,
    source: `${SOURCE}. Applicant over age 14, general filing.`,
  },
  "i-864": {
    label: "Form I-864",
    paper: 0,
    online: 0,
    source: `${SOURCE}. Affidavit of Support, general filing.`,
  },
  "i-765": {
    label: "Form I-765",
    paper: 260,
    online: 260,
    source: `${SOURCE}, Appendix C. I-765 is $260 with a pending I-485 filed on or after 4/1/2024.`,
  },
  "i-131": {
    label: "Form I-131",
    paper: 630,
    online: 580,
    source: `${SOURCE}, Appendix B. I-131 is $630 paper / $580 online with a pending I-485.`,
  },
  "g-1145": {
    label: "Form G-1145",
    paper: 0,
    online: 0,
    source: `${SOURCE}. e-Notification, general filing.`,
  },
};

export function feeLines(forms: readonly FormId[], method: FilingMethod): FeeLine[] {
  return forms.map((id) => {
    const line = LINES[id];
    return {
      id,
      label: line.label,
      amount: method === "online" ? line.online : line.paper,
      source: line.source,
    };
  });
}

export function feeTotal(forms: readonly FormId[], method: FilingMethod): number {
  return feeLines(forms, method).reduce((sum, line) => sum + line.amount, 0);
}

export const SERVICE_FEE = 0;
