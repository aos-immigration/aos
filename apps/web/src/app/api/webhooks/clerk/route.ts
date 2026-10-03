import { ConvexHttpClient } from "convex/browser";
import { NextResponse } from "next/server";
import { handleClerkWebhook } from "@/app/lib/clerkWebhook";
import { convexUrl } from "@/app/lib/runtimeConfig";

export async function POST(request: Request) {
  const rawBody = await request.text();
  try {
    const result = await handleClerkWebhook({
      rawBody,
      headers: {
        id: request.headers.get("svix-id"),
        timestamp: request.headers.get("svix-timestamp"),
        signature: request.headers.get("svix-signature"),
      },
      secret: process.env.CLERK_WEBHOOK_SECRET,
      purge: async (ownerId) => {
        const deployKey = process.env.CONVEX_DEPLOY_KEY;
        const url = convexUrl();
        if (!deployKey || !url) {
          throw new Error("Convex admin is not configured");
        }
        const { internal } = await import("../../../../../convex/_generated/api");
        const client = new ConvexHttpClient(url);
        (client as ConvexHttpClient & { setAdminAuth(token: string): void }).setAdminAuth(deployKey);
        const purge = client.mutation as unknown as (
          ref: unknown,
          args: { ownerId: string },
        ) => Promise<{ deleted: number }>;
        return purge(internal.petitioner.purgeOwner, { ownerId });
      },
    });
    return NextResponse.json(result.body, { status: result.status });
  } catch {
    return NextResponse.json({ error: "Could not purge the user" }, { status: 503 });
  }
}
