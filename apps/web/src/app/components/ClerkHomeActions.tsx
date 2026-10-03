"use client";

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

export function ClerkHomeActions() {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm">
      <Show when="signed-out">
        <SignInButton mode="redirect">
          <button type="button" className="underline">
            Sign in
          </button>
        </SignInButton>
        <SignUpButton mode="redirect">
          <button type="button" className="underline">
            Create account
          </button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <Link href="/sections" className="underline">
          Your application
        </Link>
        <Link href="/account" className="underline">
          Account
        </Link>
        <UserButton />
      </Show>
    </div>
  );
}
