import { Webhook } from "svix";

export type ClerkWebhookDeps = {
  rawBody: string;
  headers: { id: string | null; timestamp: string | null; signature: string | null };
  secret: string | undefined;
  purge: (ownerId: string) => Promise<{ deleted: number }>;
};

export async function handleClerkWebhook(deps: ClerkWebhookDeps): Promise<{
  status: number;
  body: { ok?: boolean; deleted?: number; error?: string };
}> {
  if (!deps.secret) {
    return { status: 503, body: { error: "Webhook is not configured" } };
  }
  const { id, timestamp, signature } = deps.headers;
  if (!id || !timestamp || !signature) {
    return { status: 400, body: { error: "Missing signature" } };
  }
  try {
    new Webhook(deps.secret).verify(deps.rawBody, {
      "svix-id": id,
      "svix-timestamp": timestamp,
      "svix-signature": signature,
    });
  } catch {
    return { status: 400, body: { error: "Invalid signature" } };
  }
  let event: { type?: string; data?: { id?: string } };
  try {
    event = JSON.parse(deps.rawBody) as { type?: string; data?: { id?: string } };
  } catch {
    return { status: 400, body: { error: "Invalid JSON" } };
  }
  if (event.type !== "user.deleted") {
    return { status: 200, body: { ok: true, deleted: 0 } };
  }
  const ownerId = event.data?.id;
  if (!ownerId) {
    return { status: 400, body: { error: "Missing user id" } };
  }
  const purged = await deps.purge(ownerId);
  return { status: 200, body: { ok: true, deleted: purged.deleted } };
}
