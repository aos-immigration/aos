"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type WhyWeAskProps = {
  children: React.ReactNode;
  label?: string;
  className?: string;
};

export function WhyWeAsk({
  children,
  label = "Why we ask",
  className,
}: WhyWeAskProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn(className)}>
      <button
        type="button"
        className="text-sm underline decoration-foreground/30 underline-offset-4 hover:decoration-foreground"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {label}
      </button>
      {open ? <div className="mt-3 max-w-xl text-sm leading-6">{children}</div> : null}
    </div>
  );
}
