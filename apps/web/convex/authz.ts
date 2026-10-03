import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

type AuthCtx = {
  auth: {
    getUserIdentity: () => Promise<{ subject: string } | null>;
  };
};

type Ctx = QueryCtx | MutationCtx;

export async function requireUserId(ctx: AuthCtx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }
  return identity.subject;
}

export async function requireOwnedApplication(
  ctx: Ctx,
  applicationId: Id<"applications">,
): Promise<Doc<"applications">> {
  const userId = await requireUserId(ctx);
  const application = await ctx.db.get(applicationId);
  if (!application || application.ownerId !== userId) {
    throw new Error("Application not found");
  }
  return application;
}

export async function requireOwnedAddress(ctx: MutationCtx, id: Id<"addresses">) {
  const userId = await requireUserId(ctx);
  const row = await ctx.db.get(id);
  if (!row) throw new Error("Address not found");
  const application = await ctx.db.get(row.applicationId);
  if (!application || application.ownerId !== userId) {
    throw new Error("Address not found");
  }
  return row;
}

export async function requireOwnedEmployment(
  ctx: MutationCtx,
  id: Id<"employmentEntries">,
) {
  const userId = await requireUserId(ctx);
  const row = await ctx.db.get(id);
  if (!row) throw new Error("Employment entry not found");
  const application = await ctx.db.get(row.applicationId);
  if (!application || application.ownerId !== userId) {
    throw new Error("Employment entry not found");
  }
  return row;
}
