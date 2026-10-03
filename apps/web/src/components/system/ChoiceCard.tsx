"use client";

import { cn } from "@/lib/utils";

type ChoiceCardProps = {
  title: string;
  definition: string;
  selected?: boolean;
  href?: string;
  onSelect?: () => void;
};

const cardClass = (selected?: boolean) =>
  cn(
    "flex min-h-28 w-full flex-col items-start justify-between gap-3 rounded-lg border border-border bg-card px-5 py-4 text-left transition-[background-color,border-color,transform] duration-150 ease-out",
    "hover:border-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    "active:translate-y-px",
    selected && "border-foreground bg-accent",
  );

export function ChoiceCard({
  title,
  definition,
  selected,
  href,
  onSelect,
}: ChoiceCardProps) {
  const body = (
    <>
      <span className="text-base font-medium tracking-tight">{title}</span>
      <span className="text-sm leading-5 text-foreground/80">{definition}</span>
    </>
  );

  if (href) {
    return (
      <a className={cardClass(selected)} href={href}>
        {body}
      </a>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={selected ?? false}
      className={cardClass(selected)}
      onClick={onSelect}
    >
      {body}
    </button>
  );
}
