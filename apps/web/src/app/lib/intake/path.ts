import type { FormId, Intake } from "./schema";

export function readPath(source: unknown, path: string): unknown {
  let cursor: unknown = source;
  for (const key of path.split(".")) {
    if (cursor === null || typeof cursor !== "object") return undefined;
    cursor = (cursor as Record<string, unknown>)[key];
  }
  return cursor;
}

export function writePath(intake: Intake, path: string, value: unknown): Intake {
  const next = structuredClone(intake) as unknown as Record<string, unknown>;
  const keys = path.split(".");
  let cursor: Record<string, unknown> = next;
  for (const key of keys.slice(0, -1)) {
    const child = cursor[key];
    if (child === null || typeof child !== "object") {
      throw new Error(`Intake path ${path} is missing.`);
    }
    cursor = child as Record<string, unknown>;
  }
  const leaf = keys[keys.length - 1];
  if (!leaf) throw new Error(`Intake path ${path} is missing.`);
  cursor[leaf] = value as never;
  return next as unknown as Intake;
}

export function toggleForm(intake: Intake, form: FormId): Intake {
  const selectedForms = intake.selectedForms.includes(form)
    ? intake.selectedForms.filter((id) => id !== form)
    : [...intake.selectedForms, form];
  return { ...intake, selectedForms };
}
