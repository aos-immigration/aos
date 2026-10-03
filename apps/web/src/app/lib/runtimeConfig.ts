export const DEV_FILL_SECRET = "dev-only-fill-secret";

export function isClerkConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
  );
}

export function convexUrl(): string {
  return process.env.NEXT_PUBLIC_CONVEX_URL ?? "";
}

export function fillSecret(): string | undefined {
  const explicit = process.env.PDF_FILL_SECRET;
  if (explicit) return explicit;
  if (process.env.NODE_ENV === "production") return undefined;
  return DEV_FILL_SECRET;
}

export type UnconfiguredGate = "allow" | "auth-required" | "fill-unauthorized";

export function unconfiguredGate(pathname: string, demo: boolean): UnconfiguredGate {
  if (pathname.startsWith("/api/fill")) return demo ? "allow" : "fill-unauthorized";
  if (pathname === "/account" || pathname.startsWith("/account/")) return "auth-required";
  if (pathname === "/sign-in" || pathname.startsWith("/sign-in/")) return "auth-required";
  if (pathname === "/sign-up" || pathname.startsWith("/sign-up/")) return "auth-required";
  if (pathname === "/sections" || pathname.startsWith("/sections/")) {
    return demo ? "allow" : "auth-required";
  }
  if (pathname === "/forms" || pathname.startsWith("/forms/")) {
    return demo ? "allow" : "auth-required";
  }
  return "allow";
}
