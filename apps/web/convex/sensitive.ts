import { action, internalMutation, internalQuery, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { isPublicDemo } from "../src/app/lib/demoPolicy";
import { requireOwnedApplication, requireUserId } from "./authz";
import { buildPdfPayload, type AddressRow, type EmploymentRow } from "../src/app/lib/buildPdfPayload";
import {
  decryptField,
  encryptField,
  formatANumber,
  formatSsn,
  normalizeANumber,
  normalizeSsn,
  reencryptField,
  type EncryptedField,
} from "./sensitiveCrypto";

const SSN_FIELD = "form1[0].#subform[0].Pt2Line11_SSN[0]";
const A_NUMBER_FIELD = "form1[0].#subform[0].#area[4].Pt2Line1_AlienNumber[0]";

async function storeField(value: string | null, kind: "ssn" | "aNumber") {
  if (value === null || value.trim() === "") return null;
  const digits = kind === "ssn" ? normalizeSsn(value) : normalizeANumber(value);
  if (!digits) {
    throw new Error(
      kind === "ssn"
        ? "Enter a 9-digit Social Security number"
        : "Enter an A-Number with 7 to 9 digits",
    );
  }
  const plaintext = kind === "ssn" ? formatSsn(digits) : formatANumber(digits);
  return encryptField(plaintext, digits.slice(-4));
}

export const saveSensitiveIds = mutation({
  args: {
    applicationId: v.id("applications"),
    ssn: v.optional(v.union(v.string(), v.null())),
    aNumber: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    if (isPublicDemo()) {
      throw new Error("Identity numbers are not saved in the public demo");
    }
    await requireOwnedApplication(ctx, args.applicationId);
    const existing = await ctx.db
      .query("petitionerBasics")
      .withIndex("by_application", (q) => q.eq("applicationId", args.applicationId))
      .first();
    if (!existing) throw new Error("Save petitioner basics before these numbers");
    const { _id, _creationTime, ...doc } = existing;
    if (args.ssn !== undefined) {
      const stored = await storeField(args.ssn, "ssn");
      if (stored) doc.ssn = stored;
      else delete doc.ssn;
    }
    if (args.aNumber !== undefined) {
      const stored = await storeField(args.aNumber, "aNumber");
      if (stored) doc.aNumber = stored;
      else delete doc.aNumber;
    }
    await ctx.db.replace(_id, doc);
    return {
      ssnLast4: doc.ssn?.last4 ?? null,
      aNumberLast4: doc.aNumber?.last4 ?? null,
    };
  },
});

export const loadForFill = internalQuery({
  args: { applicationId: v.id("applications") },
  handler: async (ctx, args) => {
    await requireOwnedApplication(ctx, args.applicationId);
    const row = await ctx.db
      .query("petitionerBasics")
      .withIndex("by_application", (q) => q.eq("applicationId", args.applicationId))
      .first();
    return {
      ssn: row?.ssn ? await decryptField(row.ssn) : "",
      aNumber: row?.aNumber ? await decryptField(row.aNumber) : "",
    };
  },
});

export const loadOwnedI130 = internalQuery({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);
    const application = await ctx.db
      .query("applications")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .first();
    if (!application) return null;
    const basics = await ctx.db
      .query("petitionerBasics")
      .withIndex("by_application", (q) => q.eq("applicationId", application._id))
      .first();
    if (!basics) return null;
    const addresses = await ctx.db
      .query("addresses")
      .withIndex("by_application_role", (q) =>
        q.eq("applicationId", application._id).eq("personRole", "petitioner"),
      )
      .collect();
    const employment = await ctx.db
      .query("employmentEntries")
      .withIndex("by_application_role", (q) =>
        q.eq("applicationId", application._id).eq("personRole", "petitioner"),
      )
      .collect();
    const addressRows: AddressRow[] = addresses.map((row) => ({
      street: row.street,
      unit: row.unit,
      city: row.city,
      state: row.state,
      zip: row.zip,
      country: row.country,
      startMonth: row.startMonth,
      startYear: row.startYear,
      endMonth: row.endMonth,
      endYear: row.endYear,
      isCurrent: row.isCurrent,
      addressType: row.addressType,
      sortOrder: row.sortOrder,
    }));
    const employmentRows: EmploymentRow[] = employment.map((row) => ({
      status: row.status,
      employerName: row.employerName,
      jobTitle: row.jobTitle,
      city: row.city,
      state: row.state,
      country: row.country,
      fromMonth: row.fromMonth,
      fromYear: row.fromYear,
      toMonth: row.toMonth,
      toYear: row.toYear,
      isCurrent: row.isCurrent,
      sortOrder: row.sortOrder,
    }));
    return {
      payload: buildPdfPayload(
        {
          givenName: basics.givenName,
          middleName: basics.middleName,
          familyName: basics.familyName,
          dateOfBirth: basics.dateOfBirth,
          relationship: basics.relationship,
        },
        addressRows,
        employmentRows,
      ),
      ssn: basics.ssn ? await decryptField(basics.ssn) : "",
      aNumber: basics.aNumber ? await decryptField(basics.aNumber) : "",
    };
  },
});

export const reencryptAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("petitionerBasics").collect();
    let updated = 0;
    for (const row of rows) {
      const patch: { ssn?: EncryptedField; aNumber?: EncryptedField } = {};
      if (row.ssn && row.ssn.keyVersion !== Number(process.env.SENSITIVE_ID_KEY_VERSION || "1")) {
        patch.ssn = await reencryptField(row.ssn);
      }
      if (
        row.aNumber &&
        row.aNumber.keyVersion !== Number(process.env.SENSITIVE_ID_KEY_VERSION || "1")
      ) {
        patch.aNumber = await reencryptField(row.aNumber);
      }
      if (patch.ssn || patch.aNumber) {
        await ctx.db.patch(row._id, patch);
        updated += 1;
      }
    }
    return { updated };
  },
});

export const fillI130 = action({
  args: {},
  handler: async (ctx) => {
    if (isPublicDemo()) {
      throw new Error("The public demo fills the fictional packet from the web server");
    }
    const userId = await requireUserId(ctx);
    const owned = await ctx.runQuery(internal.sensitive.loadOwnedI130, {});
    if (!owned) throw new Error("Save petitioner basics before preview");
    const fields = { ...owned.payload.fields };
    delete fields[SSN_FIELD];
    delete fields[A_NUMBER_FIELD];
    if (owned.ssn) fields[SSN_FIELD] = owned.ssn;
    if (owned.aNumber) fields[A_NUMBER_FIELD] = owned.aNumber;
    const secret = process.env.PDF_FILL_SECRET ?? "";
    if (!secret) throw new Error("PDF fill is not configured");
    const apiBase = process.env.PDF_API_URL || process.env.API_URL || "http://localhost:8000";
    const response = await fetch(`${apiBase}/fill/i-130`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Fill-Secret": secret,
        "X-Fill-Caller": userId,
      },
      body: JSON.stringify({ fields, checkboxes: owned.payload.checkboxes }),
    });
    if (!response.ok) throw new Error("PDF fill failed");
    const bytes = new Uint8Array(await response.arrayBuffer());
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  },
});
