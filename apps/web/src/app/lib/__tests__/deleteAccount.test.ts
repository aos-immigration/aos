import { readFileSync } from "node:fs";
import path from "node:path";
import { Webhook } from "svix";
import { describe, expect, it } from "vitest";
import { handleClerkWebhook } from "../clerkWebhook";
import { deleteAccount } from "../deleteAccount";

const WEBHOOK_SECRET = `whsec_${Buffer.from("abcdefghijklmnopqrstuvwxyz012345").toString("base64")}`;

function signed(payload: string) {
  const id = "msg_test";
  const timestamp = new Date();
  const signature = new Webhook(WEBHOOK_SECRET).sign(id, timestamp, payload);
  return {
    id,
    timestamp: String(Math.floor(timestamp.getTime() / 1000)),
    signature,
  };
}

describe("deleteAccount", () => {
  it("purges Convex data and then deletes the Clerk user", async () => {
    const order: string[] = [];
    const result = await deleteAccount({
      purge: async () => {
        order.push("convex");
        return { deleted: 1 };
      },
      deleteClerkUser: async () => {
        order.push("clerk");
      },
      sleep: async () => undefined,
    });
    expect(result).toEqual({ deleted: 1 });
    expect(order).toEqual(["convex", "clerk"]);
  });

  it("retries a failed Clerk delete and treats a missing user as done", async () => {
    let attempts = 0;
    const retried = await deleteAccount({
      purge: async () => ({ deleted: 0 }),
      deleteClerkUser: async () => {
        attempts += 1;
        if (attempts < 3) throw Object.assign(new Error("unavailable"), { status: 503 });
      },
      sleep: async () => undefined,
    });
    expect(retried).toEqual({ deleted: 0 });
    expect(attempts).toBe(3);

    const gone = await deleteAccount({
      purge: async () => ({ deleted: 0 }),
      deleteClerkUser: async () => {
        throw Object.assign(new Error("missing"), { status: 404 });
      },
      sleep: async () => undefined,
    });
    expect(gone).toEqual({ deleted: 0 });
  });

  it("does not retry a Clerk client error", async () => {
    let attempts = 0;
    await expect(
      deleteAccount({
        purge: async () => ({ deleted: 1 }),
        deleteClerkUser: async () => {
          attempts += 1;
          throw Object.assign(new Error("bad"), { status: 400 });
        },
        sleep: async () => undefined,
      }),
    ).rejects.toThrow("bad");
    expect(attempts).toBe(1);
  });
});

describe("Clerk user.deleted webhook", () => {
  it("rejects a bad signature and purges only user.deleted", async () => {
    const purged: string[] = [];
    const purge = async (ownerId: string) => {
      purged.push(ownerId);
      return { deleted: purged.filter((id) => id === ownerId).length === 1 ? 1 : 0 };
    };
    const payload = JSON.stringify({ type: "user.deleted", data: { id: "user_alice" } });
    const headers = signed(payload);
    const bad = await handleClerkWebhook({
      rawBody: payload,
      headers: { ...headers, signature: "v1,not-a-signature" },
      secret: WEBHOOK_SECRET,
      purge,
    });
    expect(bad.status).toBe(400);
    expect(purged).toEqual([]);

    const first = await handleClerkWebhook({
      rawBody: payload,
      headers,
      secret: WEBHOOK_SECRET,
      purge,
    });
    const second = await handleClerkWebhook({
      rawBody: payload,
      headers: signed(payload),
      secret: WEBHOOK_SECRET,
      purge: async (ownerId) => {
        purged.push(ownerId);
        return { deleted: 0 };
      },
    });
    expect(first).toEqual({ status: 200, body: { ok: true, deleted: 1 } });
    expect(second).toEqual({ status: 200, body: { ok: true, deleted: 0 } });
    expect(purged).toEqual(["user_alice", "user_alice"]);

    const other = JSON.stringify({ type: "user.created", data: { id: "user_bob" } });
    const ignored = await handleClerkWebhook({
      rawBody: other,
      headers: signed(other),
      secret: WEBHOOK_SECRET,
      purge,
    });
    expect(ignored).toEqual({ status: 200, body: { ok: true, deleted: 0 } });
    expect(purged).toEqual(["user_alice", "user_alice"]);
  });
});

describe("account page", () => {
  it("calls the server delete endpoint", () => {
    const source = readFileSync(path.resolve(__dirname, "../../account/page.tsx"), "utf8");
    expect(source).toContain('fetch("/api/account/delete"');
    expect(source).not.toContain("user.delete()");
    expect(source).not.toContain("useUser");
    expect(source).not.toContain("deleteMyApplication");
  });
});
