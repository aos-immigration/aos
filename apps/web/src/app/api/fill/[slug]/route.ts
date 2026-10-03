import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { buildPdfPayload } from "@/app/lib/buildPdfPayload";
import { DEMO_COOKIE, demoPdfAddress, demoPdfBasics } from "@/app/lib/demoCouple";
import { convexUrl, fillSecret, isClerkConfigured } from "@/app/lib/runtimeConfig";

const DEMO_SLUG = "i-130";

function pdfResponse(bytes: ArrayBuffer | Uint8Array, slug: string) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return new NextResponse(Buffer.from(view), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${slug}-filled.pdf"`,
    },
  });
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const demo = (await cookies()).get(DEMO_COOKIE)?.value === "1";
  const clerk = isClerkConfigured();
  const { userId, getToken } = clerk ? await auth() : { userId: null, getToken: null };
  if (!userId && !demo) {
    return NextResponse.json(
      { error: clerk ? "Unauthorized" : "Auth is not configured" },
      { status: clerk ? 401 : 503 },
    );
  }

  const { slug } = await context.params;
  if (slug !== DEMO_SLUG) {
    return NextResponse.json({ error: "Unknown form" }, { status: 404 });
  }

  if (userId) {
    if (!convexUrl() || !getToken) {
      return NextResponse.json({ error: "Auth is not configured" }, { status: 503 });
    }
    const token = await getToken({ template: "convex" });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { fetchAction } = await import("convex/nextjs");
    const { api } = await import("../../../../../convex/_generated/api");
    try {
      const pdf = await fetchAction(api.sensitive.fillI130, {}, { token });
      return pdfResponse(Buffer.from(pdf, "base64"), slug);
    } catch {
      return NextResponse.json({ error: "PDF fill failed" }, { status: 502 });
    }
  }

  const secret = fillSecret();
  if (!secret) {
    return NextResponse.json({ error: "PDF fill is not configured" }, { status: 500 });
  }

  const payload = buildPdfPayload(demoPdfBasics(), [demoPdfAddress()], []);
  const apiBase = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  let upstream: Response;
  try {
    upstream = await fetch(`${apiBase}/fill/${DEMO_SLUG}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Fill-Secret": secret,
        "X-Fill-Caller": "demo",
      },
      body: JSON.stringify(payload),
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

  return pdfResponse(await upstream.arrayBuffer(), DEMO_SLUG);
}
