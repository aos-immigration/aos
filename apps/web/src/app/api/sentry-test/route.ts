import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export const dynamic = "force-dynamic";

export function POST(request: Request) {
    const error = new Error("Sentry Test Error — triggered from dashboard navbar");
    Sentry.captureException(error);
    return NextResponse.json({ success: true, message: "Error sent to Sentry" });
}
