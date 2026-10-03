import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { DEMO_COOKIE } from "@/app/lib/demoCouple";
import { redactFillPayload } from "@/app/lib/sensitiveId";

const SLUG = /^[a-z0-9-]+$/;

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const { userId } = await auth();
  const demo = (await cookies()).get(DEMO_COOKIE)?.value === "1";
  if (!userId && !demo) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = process.env.PDF_FILL_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "PDF fill is not configured" }, { status: 500 });
  }

  const { slug } = await context.params;
  if (!SLUG.test(slug)) {
    return NextResponse.json({ error: "Unknown form" }, { status: 404 });
  }

  let body: string;
  try {
    const parsed = JSON.parse(await request.text()) as {
      fields?: Record<string, string>;
      checkboxes?: Record<string, boolean>;
    };
    body = JSON.stringify(redactFillPayload(parsed));
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const apiBase = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  let upstream: Response;
  try {
    upstream = await fetch(`${apiBase}/fill/${slug}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Fill-Secret": secret,
      },
      body,
    });
  } catch {
    return NextResponse.json({ error: "PDF fill service is unavailable" }, { status: 502 });
  }

  if (!upstream.ok) {
    return NextResponse.json(
      { error: "PDF fill failed" },
      { status: upstream.status === 404 ? 404 : 502 },
    );
  }

  return new NextResponse(await upstream.arrayBuffer(), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition":
        upstream.headers.get("Content-Disposition") ??
        `attachment; filename="${slug}-filled.pdf"`,
    },
  });
}
