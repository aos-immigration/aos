import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { DEMO_COOKIE } from "@/app/lib/demoCouple";

const isIntakeRoute = createRouteMatcher(["/sections(.*)", "/forms(.*)"]);
const isAccountRoute = createRouteMatcher(["/account(.*)"]);
const isFillRoute = createRouteMatcher(["/api/fill(.*)"]);

function demoOn(request: { cookies: { get: (name: string) => { value: string } | undefined } }) {
  return request.cookies.get(DEMO_COOKIE)?.value === "1";
}

export default clerkMiddleware(async (auth, request) => {
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

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
