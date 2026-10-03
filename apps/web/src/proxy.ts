import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { DEMO_COOKIE } from "@/app/lib/demoCouple";
import { isClerkConfigured, unconfiguredGate } from "@/app/lib/runtimeConfig";

const isIntakeRoute = createRouteMatcher(["/sections(.*)", "/forms(.*)", "/start(.*)"]);
const isAccountRoute = createRouteMatcher(["/account(.*)", "/api/account(.*)"]);
const isFillRoute = createRouteMatcher([
  "/api/fill(.*)",
  "/api/fill-intake(.*)",
  "/api/preview-intake",
  "/api/packet",
]);

function demoOn(request: NextRequest) {
  return request.cookies.get(DEMO_COOKIE)?.value === "1";
}

const withClerk = clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();
  if (userId && demoOn(request) && isIntakeRoute(request)) {
    const redirect = NextResponse.redirect(request.url);
    redirect.cookies.set(DEMO_COOKIE, "", { path: "/", maxAge: 0 });
    return redirect;
  }
  if (isFillRoute(request)) {
    if (!userId && !demoOn(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }
  if (isAccountRoute(request)) {
    await auth.protect();
    return;
  }
  if (isIntakeRoute(request) && !demoOn(request)) {
    await auth.protect();
  }
  return NextResponse.next();
});

function withoutClerk(request: NextRequest) {
  const gate = unconfiguredGate(request.nextUrl.pathname, demoOn(request));
  if (gate === "auth-required") {
    return NextResponse.redirect(new URL("/auth-required", request.url));
  }
  if (gate === "fill-unauthorized") {
    return NextResponse.json({ error: "Auth is not configured" }, { status: 503 });
  }
  return NextResponse.next();
}

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (!isClerkConfigured()) return withoutClerk(request);
  return withClerk(request, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
