import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export function AuthNotConfigured() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col justify-center gap-4 px-6 py-16">
      <p className="text-sm font-medium">Auth is not configured</p>
      <h1 className="type-display text-4xl">Sign-in is not set up on this machine</h1>
      <p className="text-lg leading-7">
        There are no Clerk keys, so accounts and saved answers are unavailable.
        The demo couple is fake and nothing is stored.
      </p>
      <Link href="/demo" className={buttonVariants({ size: "cta" })}>
        Explore the demo couple
      </Link>
    </main>
  );
}
