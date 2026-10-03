"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

const TOPICS = [
  {
    title: "A prior marriage",
    line: "An attorney can look at how it ended.",
  },
  {
    title: "An arrest or a charge",
    line: "Including one that was dismissed.",
  },
  {
    title: "Time without lawful status",
    line: "Or work without authorization.",
  },
  {
    title: "A previous denial",
    line: "Or a removal case.",
  },
  {
    title: "A lawyer reading the draft",
    line: "Before you sign or file.",
  },
] as const;

export function StartScreen() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-8">
      <div>
        <h1 className="type-title">Before you file</h1>
        <p className="mt-2 text-sm leading-6">
          People talk to an attorney about the items below. AOS does not decide whether you can file.
        </p>
      </div>
      <ul className="divide-y divide-border rounded-lg border border-border">
        {TOPICS.map((topic) => (
          <li key={topic.title} className="px-4 py-3">
            <p className="text-sm font-medium">{topic.title}</p>
            <p className="text-sm text-foreground/70">{topic.line}</p>
          </li>
        ))}
      </ul>
      <div className="flex flex-col items-start gap-3">
        <Link href="/sections" className={buttonVariants({ size: "cta" })}>
          Continue to my forms
        </Link>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/cost" className="underline decoration-foreground/30 underline-offset-4">
            USCIS fees
          </Link>
          <Link href="/sections/documents" className="underline decoration-foreground/30 underline-offset-4">
            Documents
          </Link>
        </div>
      </div>
    </div>
  );
}
