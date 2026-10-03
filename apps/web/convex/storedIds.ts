// Identity numbers that must never be a plaintext column or a plaintext write.
// Adding a name here is enough for the storage test to require it to be blanked
// or encrypted. Petitioner and beneficiary both use these keys.
export const STORED_ID_FIELD_NAMES = [
  "ssn",
  "aNumber",
  "alienNumber",
  "i94",
  "i94Number",
  "passport",
  "passportNumber",
] as const;

export type StoredIdFieldName = (typeof STORED_ID_FIELD_NAMES)[number];

const ID_FIELDS = new Set<string>(STORED_ID_FIELD_NAMES);

export function isEncryptedField(value: unknown): value is {
  ciphertext: string;
  iv: string;
  keyVersion: number;
  last4: string;
} {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.ciphertext === "string" &&
    typeof record.iv === "string" &&
    typeof record.keyVersion === "number" &&
    typeof record.last4 === "string"
  );
}

export function stripStoredIds<T>(value: T): T {
  return walk(value) as T;
}

function walk(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(walk);
  if (!value || typeof value !== "object") return value;
  const out: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (ID_FIELDS.has(key) && !isEncryptedField(child)) {
      out[key] = typeof child === "string" ? "" : walk(child);
      continue;
    }
    out[key] = walk(child);
  }
  return out;
}
