export const STAGES = [
  { id: "start", label: "Start", note: "Choose forms" },
  { id: "collect", label: "Collect", note: "Answer questions" },
  { id: "review", label: "Review", note: "Cross-form checks" },
  { id: "assemble", label: "Assemble", note: "Preview the PDFs" },
  { id: "file", label: "File", note: "You submit to USCIS" },
] as const;

export type StageId = (typeof STAGES)[number]["id"];

export type StageVisual = "done" | "current" | "upcoming";

export function stageVisual(
  id: StageId,
  current: StageId | null,
  done: readonly StageId[],
): StageVisual {
  if (done.includes(id)) return "done";
  if (current === id) return "current";
  return "upcoming";
}
