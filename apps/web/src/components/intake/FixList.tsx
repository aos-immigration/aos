"use client";

import Link from "next/link";
import type { IntakeIssue } from "@/app/lib/intake/checks";

export function FixList({ issues }: { issues: readonly IntakeIssue[] }) {
  if (issues.length === 0) {
    return <p className="text-sm">No open checks.</p>;
  }
  return (
    <ul className="divide-y divide-border rounded-lg border border-border">
      {issues.map((issue) => (
        <li key={issue.id}>
          <Link href={issue.href} className="block px-4 py-3 text-sm leading-6 hover:bg-accent">
            {issue.summary}
          </Link>
        </li>
      ))}
    </ul>
  );
}
