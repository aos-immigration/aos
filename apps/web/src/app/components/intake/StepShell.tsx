"use client";

import React from "react";

type StepShellProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function StepShell({ title, description, children }: StepShellProps) {
  return (
    <section className="w-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          {description}
        </p>
      ) : null}
      <div className="mt-6 grid gap-4">{children}</div>
    </section>
  );
}
