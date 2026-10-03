"use client";

import type { HistoryBar } from "@/app/lib/intake/timeline";
import { cn } from "@/lib/utils";

export function HistoryTrack({
  title,
  bars,
}: {
  title: string;
  bars: readonly HistoryBar[];
}) {
  return (
    <section className="space-y-3" aria-label={title}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium">{title}</h2>
        <p className="text-xs text-foreground/70">Last 5 years</p>
      </div>
      {bars.length === 0 ? (
        <p className="text-sm text-foreground/70">No dated period yet.</p>
      ) : (
        <div className="relative h-16 rounded-md border border-border bg-muted/40">
          {bars.map((bar) => (
            <div
              key={bar.id}
              className="absolute top-3 h-10"
              style={{ left: `${bar.left}%`, width: `${bar.width}%` }}
            >
              {bar.gapBefore ? (
                <span className="absolute -left-1 top-0 h-full w-1 bg-destructive" title="Gap" />
              ) : null}
              <div
                className={cn(
                  "flex h-full items-center overflow-hidden rounded-sm px-2 text-xs text-background",
                  bar.overlap ? "bg-destructive" : "bg-foreground",
                )}
              >
                <span className="truncate">{bar.label}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
