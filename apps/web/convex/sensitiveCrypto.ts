export type EncryptedField = {
  ciphertext: string;
  iv: string;
  keyVersion: number;
  last4: string;
};

const AES_GCM = "AES-GCM";

function bytesToBinary(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return binary;
}

function binaryToBytes(binary: string): Uint8Array {
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function encodeBase64(bytes: Uint8Array): string {
  return btoa(bytesToBinary(bytes));
}

export function decodeBase64(value: string): Uint8Array {
  return binaryToBytes(atob(value));
}

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

export function formatSsn(digits: string): string {
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

export function formatANumber(digits: string): string {
  return `A${digits}`;
}

function currentVersion(): number {
  const version = Number(process.env.SENSITIVE_ID_KEY_VERSION || "1");
  if (!Number.isInteger(version) || version < 1) {
    throw new Error("Sensitive ID encryption is not configured");
  }
  return version;
}

function keyFor(version: number): Uint8Array | null {
  const current = currentVersion();
  const raw =
    version === current
      ? process.env.SENSITIVE_ID_KEY
      : version === Number(process.env.SENSITIVE_ID_KEY_PREVIOUS_VERSION || "0")
        ? process.env.SENSITIVE_ID_KEY_PREVIOUS
        : undefined;
  if (!raw) return null;
  const bytes = decodeBase64(raw);
  if (bytes.byteLength !== 32) return null;
  return bytes;
}

function asBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

async function importKey(bytes: Uint8Array, usage: "encrypt" | "decrypt"): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", asBuffer(bytes), AES_GCM, false, [usage]);
}

export async function encryptField(plaintext: string, last4: string): Promise<EncryptedField> {
  const version = currentVersion();
  const material = keyFor(version);
  if (!material) throw new Error("Sensitive ID encryption is not configured");
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await importKey(material, "encrypt");
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: AES_GCM, iv: asBuffer(iv) },
      key,
      new TextEncoder().encode(plaintext),
    ),
  );
  return {
    ciphertext: encodeBase64(ciphertext),
    iv: encodeBase64(iv),
    keyVersion: version,
    last4,
  };
}

export async function decryptField(field: EncryptedField): Promise<string> {
  const material = keyFor(field.keyVersion);
  if (!material) throw new Error("Unsupported key version");
  const key = await importKey(material, "decrypt");
  try {
    const plain = await crypto.subtle.decrypt(
      { name: AES_GCM, iv: asBuffer(decodeBase64(field.iv)) },
      key,
      asBuffer(decodeBase64(field.ciphertext)),
    );
    return new TextDecoder().decode(plain);
  } catch {
    throw new Error("Sensitive ID could not be decrypted");
  }
}

export async function reencryptField(field: EncryptedField): Promise<EncryptedField> {
  const plaintext = await decryptField(field);
  return encryptField(plaintext, field.last4);
}
