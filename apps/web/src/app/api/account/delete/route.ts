import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { deleteAccount } from "@/app/lib/deleteAccount";
import { convexUrl, isClerkConfigured } from "@/app/lib/runtimeConfig";

export async function POST() {
  if (!isClerkConfigured() || !convexUrl()) {
    return NextResponse.json({ error: "Auth is not configured" }, { status: 503 });
  }
  const { userId, getToken } = await auth();
  if (!userId || !getToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = await getToken({ template: "convex" });
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await deleteAccount({
      purge: async () => {
        const { fetchMutation } = await import("convex/nextjs");
        const { api } = await import("../../../../../convex/_generated/api");
        return fetchMutation(api.petitioner.deleteMyApplication, {}, { token });
      },
      deleteClerkUser: async () => {
        const client = await clerkClient();
        await client.users.deleteUser(userId);
      },
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Account deletion failed" }, { status: 502 });
  }
}
