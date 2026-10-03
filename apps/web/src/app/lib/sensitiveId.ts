export function normalizeSsn(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (!/^\d{9}$/.test(digits)) return null;
  const area = Number(digits.slice(0, 3));
  const group = digits.slice(3, 5);
  const serial = digits.slice(5);
  if (area === 0 || area === 666 || area >= 900) return null;
  if (group === "00" || serial === "0000") return null;
  return digits;
}

export function normalizeANumber(value: string): string | null {
  const trimmed = value.trim().replace(/^a/i, "").replace(/\D/g, "");
  if (!/^\d{7,9}$/.test(trimmed)) return null;
  return trimmed;
}

export function maskSsnLast4(last4: string | null | undefined): string {
  return /^\d{4}$/.test(last4 ?? "") ? `•••-••-${last4}` : "•••-••-••••";
}

export function maskANumberLast4(last4: string | null | undefined): string {
  return /^\d{4}$/.test(last4 ?? "") ? `A••••${last4}` : "A••••••••";
}

const WHOLE_SSN = /^(?:\d{3}-\d{2}-\d{4}|\d{9})$/;
const WHOLE_ANUMBER = /^A?\d{7,9}$/i;

export function redactFillValue(value: string): string {
  if (WHOLE_SSN.test(value) || WHOLE_ANUMBER.test(value)) return "";
  return value;
}

export function redactFillPayload<T extends { fields?: Record<string, string> }>(payload: T): T {
  if (!payload.fields) return payload;
  const fields: Record<string, string> = {};
  for (const [name, value] of Object.entries(payload.fields)) {
    fields[name] = redactFillValue(value);
  }
  return { ...payload, fields };
}
