import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { DEMO_COOKIE } from "@/app/lib/demoCouple";
import { demoIntake } from "@/app/lib/intake/demo";
import { convexUrl, fillSecret, isClerkConfigured } from "@/app/lib/runtimeConfig";

type Kind = "preview" | "packet" | "fill";

function bytesResponse(bytes: Uint8Array, contentType: string, filename: string) {
  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

async function demoUpstream(kind: Kind, slug?: string) {
  const secret = fillSecret();
  if (!secret) {
    return NextResponse.json({ error: "PDF fill is not configured" }, { status: 500 });
  }
  const intake = demoIntake();
  const apiBase = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const path =
    kind === "preview"
      ? "/preview-intake"
      : kind === "packet"
        ? "/packet"
        : `/fill-intake/${slug}`;
  const body =
    kind === "preview" ? { intake } : { intake, acknowledged: true };
  let upstream: Response;
  try {
    upstream = await fetch(`${apiBase}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Fill-Secret": secret,
        "X-Fill-Caller": "demo",
      },
      body: JSON.stringify(body),
    });
  } catch {
    return NextResponse.json({ error: "PDF fill service is unavailable" }, { status: 502 });
  }
  if (!upstream.ok) {
    return NextResponse.json(
      { error: "PDF fill failed" },
      { status: upstream.status === 404 || upstream.status === 400 ? upstream.status : 502 },
    );
  }
  if (kind === "preview") {
    return NextResponse.json(await upstream.json(), {
      headers: { "Cache-Control": "no-store" },
    });
  }
  if (kind === "packet") {
    return bytesResponse(new Uint8Array(await upstream.arrayBuffer()), "application/zip", "aos-packet.zip");
  }
  return bytesResponse(
    new Uint8Array(await upstream.arrayBuffer()),
    "application/pdf",
    `${slug}-filled.pdf`,
  );
}

export async function proxyPdf(kind: Kind, slug?: string) {
  const clerk = isClerkConfigured();
  const demoCookie = (await cookies()).get(DEMO_COOKIE)?.value === "1";
  const session = clerk ? await auth() : { userId: null as string | null, getToken: null };
  const userId = session.userId;
  if (clerk && !userId && !demoCookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (userId) {
    if (!convexUrl() || !session.getToken) {
      return NextResponse.json({ error: "Auth is not configured" }, { status: 503 });
    }
    const token = await session.getToken({ template: "convex" });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { fetchAction } = await import("convex/nextjs");
    const { api } = await import("../../../convex/_generated/api");
    try {
      if (kind === "preview") {
        const body = await fetchAction(api.intake.previewOwnedIntake, {}, { token });
        return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
      }
      if (kind === "packet") {
        const encoded = await fetchAction(api.intake.packetOwnedIntake, {}, { token });
        return bytesResponse(Buffer.from(encoded, "base64"), "application/zip", "aos-packet.zip");
      }
      const encoded = await fetchAction(api.intake.fillOwnedIntake, { slug: slug ?? "" }, { token });
      return bytesResponse(Buffer.from(encoded, "base64"), "application/pdf", `${slug}-filled.pdf`);
    } catch {
      return NextResponse.json({ error: "PDF fill failed" }, { status: 502 });
    }
  }
  return demoUpstream(kind, slug);
}
