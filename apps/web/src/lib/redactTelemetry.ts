const SSN_TEXT = /\b\d{3}-?\d{2}-?\d{4}\b/g;
const A_NUMBER_TEXT = /\bA\d{7,9}\b/gi;

export function redactSensitiveText(value: string): string {
  return value.replace(SSN_TEXT, "[redacted]").replace(A_NUMBER_TEXT, "[redacted]");
}

export function scrubUrl(value: string): string {
  const query = value.indexOf("?");
  const hash = value.indexOf("#");
  const end = [query, hash].filter((index) => index >= 0).sort((a, b) => a - b)[0];
  return end === undefined ? value : value.slice(0, end);
}

export function redactUnknown(value: unknown): unknown {
  if (typeof value === "string") return redactSensitiveText(scrubUrl(value));
  if (Array.isArray(value)) return value.map(redactUnknown);
  if (value && typeof value === "object") {
    const copy: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) copy[key] = redactUnknown(child);
    return copy;
  }
  return value;
}
