import { action, internalQuery, mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { parseIntake, type Intake } from "../src/app/lib/intake/schema";
import { requireOwnedApplication, requireUserId } from "./authz";
import { isEncryptedField, stripStoredIds } from "./storedIds";
import {
  decryptField,
  encryptField,
  formatANumber,
  formatSsn,
  normalizeANumber,
  normalizeSsn,
  type EncryptedField,
} from "./sensitiveCrypto";

type PersonIds = {
  ssn: string | EncryptedField;
  aNumber: string | EncryptedField;
};

async function sealOne(
  incoming: string,
  previous: unknown,
  normalize: (value: string) => string | null,
  format: (digits: string) => string,
): Promise<EncryptedField | ""> {
  const trimmed = incoming.trim();
  if (isEncryptedField(previous) && (trimmed === "" || trimmed === previous.last4)) {
    return previous;
  }
  const normalized = normalize(trimmed);
  if (!normalized) return "";
  return encryptField(format(normalized), normalized.slice(-4));
}

async function sealPerson(person: Intake["petitioner"], previous: unknown): Promise<PersonIds> {
  const prior =
    previous && typeof previous === "object" ? (previous as Record<string, unknown>) : {};
  return {
    ssn: await sealOne(person.ssn, prior.ssn, normalizeSsn, formatSsn),
    aNumber: await sealOne(person.aNumber, prior.aNumber, normalizeANumber, formatANumber),
  };
}

function maskValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (isEncryptedField(value)) return value.last4;
  return "";
}

function maskPayload(payload: string): string {
  const intake = JSON.parse(payload) as {
    petitioner?: Record<string, unknown>;
    beneficiary?: Record<string, unknown>;
  };
  for (const role of ["petitioner", "beneficiary"] as const) {
    const person = intake[role];
    if (!person) continue;
    person.ssn = maskValue(person.ssn);
    person.aNumber = maskValue(person.aNumber);
  }
  return JSON.stringify(intake);
}

async function reveal(value: unknown): Promise<string> {
  if (typeof value === "string") return value;
  if (isEncryptedField(value)) return decryptField(value);
  return "";
}

async function revealIntake(payload: string): Promise<Intake> {
  const intake = JSON.parse(payload) as Intake;
  intake.petitioner.ssn = await reveal(intake.petitioner.ssn);
  intake.petitioner.aNumber = await reveal(intake.petitioner.aNumber);
  intake.beneficiary.ssn = await reveal(intake.beneficiary.ssn);
  intake.beneficiary.aNumber = await reveal(intake.beneficiary.aNumber);
  return intake;
}

export const getIntake = query({
  args: { applicationId: v.id("applications") },
  handler: async (ctx, args) => {
    await requireOwnedApplication(ctx, args.applicationId);
    const row = await ctx.db
      .query("intakes")
      .withIndex("by_application", (q) => q.eq("applicationId", args.applicationId))
      .unique();
    if (!row) return null;
    return { ...row, payload: maskPayload(row.payload) };
  },
});

export const saveIntake = mutation({
  args: {
    applicationId: v.id("applications"),
    payload: v.string(),
  },
  handler: async (ctx, args) => {
    await requireOwnedApplication(ctx, args.applicationId);
    const intake = parseIntake(args.payload);
    const existing = await ctx.db
      .query("intakes")
      .withIndex("by_application", (q) => q.eq("applicationId", args.applicationId))
      .unique();
    const previous = existing ? (JSON.parse(existing.payload) as Intake) : null;
    const sealed = {
      ...intake,
      petitioner: {
        ...intake.petitioner,
        ...(await sealPerson(intake.petitioner, previous?.petitioner)),
      },
      beneficiary: {
        ...intake.beneficiary,
        ...(await sealPerson(intake.beneficiary, previous?.beneficiary)),
      },
    };
    const stored = stripStoredIds(sealed);
    const updatedAt = Date.now();
    const payload = JSON.stringify(stored);
    if (existing) {
      await ctx.db.patch(existing._id, { payload, updatedAt });
      return existing._id;
    }
    return await ctx.db.insert("intakes", {
      applicationId: args.applicationId,
      payload,
      updatedAt,
    });
  },
});

export const loadDecryptedIntake = internalQuery({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const application = await ctx.db
      .query("applications")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .unique();
    if (!application) return null;
    const row = await ctx.db
      .query("intakes")
      .withIndex("by_application", (q) => q.eq("applicationId", application._id))
      .unique();
    if (!row) return null;
    return revealIntake(row.payload);
  },
});

async function postOwned(userId: string, path: string, body: unknown): Promise<Response> {
  const secret = process.env.PDF_FILL_SECRET ?? "";
  if (!secret) throw new Error("PDF fill is not configured");
  const apiBase = process.env.PDF_API_URL || process.env.API_URL || "http://localhost:8000";
  return fetch(`${apiBase}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Fill-Secret": secret,
      "X-Fill-Caller": userId,
    },
    body: JSON.stringify(body),
  });
}

async function bytesToBase64(response: Response): Promise<string> {
  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export const previewOwnedIntake = action({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const intake = await ctx.runQuery(internal.intake.loadDecryptedIntake, {});
    if (!intake) throw new Error("Save your answers before preview");
    const response = await postOwned(userId, "/preview-intake", { intake });
    if (!response.ok) throw new Error("PDF fill failed");
    return response.json();
  },
});

export const packetOwnedIntake = action({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const intake = await ctx.runQuery(internal.intake.loadDecryptedIntake, {});
    if (!intake) throw new Error("Save your answers before preview");
    const response = await postOwned(userId, "/packet", { intake, acknowledged: true });
    if (!response.ok) throw new Error("PDF fill failed");
    return bytesToBase64(response);
  },
});

export const fillOwnedIntake = action({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const intake = await ctx.runQuery(internal.intake.loadDecryptedIntake, {});
    if (!intake) throw new Error("Save your answers before preview");
    const response = await postOwned(userId, `/fill-intake/${args.slug}`, {
      intake,
      acknowledged: true,
    });
    if (!response.ok) throw new Error("PDF fill failed");
    return bytesToBase64(response);
  },
});
