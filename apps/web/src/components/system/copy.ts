export const DISCLAIMER =
  "AOS is self-help software, not a law firm, and is not a substitute for the advice of an attorney. Not affiliated with USCIS or any government agency.";

export const SHORT_DISCLAIMER =
  "Not a law firm. Not a substitute for the advice of an attorney. Not affiliated with USCIS.";

export const REQUIRED_DISCLAIMER_PHRASES = [
  "not a substitute for the advice of an attorney",
  "not a law firm",
  "not affiliated with USCIS",
] as const;

export type CopyLine = {
  id: string;
  text: string;
  requires: string | null;
};

export const PRIVACY_LINES: CopyLine[] = [
  {
    id: "store",
    text: "AOS stores the answers you type so it can fill the forms you choose and let you edit them.",
    requires: null,
  },
  {
    id: "sell",
    text: "We don't sell your information or share it for advertising.",
    requires: null,
  },
  {
    id: "ai",
    text: "We don't send your answers to AI providers.",
    requires: null,
  },
  {
    id: "owner",
    text: "Only you can see a case when you are signed in.",
    requires: "auth",
  },
  {
    id: "encrypt",
    text: "We encrypt Social Security numbers before storing them.",
    requires: "encryption",
  },
  {
    id: "replay",
    text: "We don't record your screen or form typing for analytics.",
    requires: "datadog-replay-off",
  },
];

export function visibleCopy(lines: CopyLine[]): CopyLine[] {
  return lines.filter((line) => line.requires === null);
}
