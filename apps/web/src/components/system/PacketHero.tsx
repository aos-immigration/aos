const LINES = [
  { label: "Family name", width: "58%" },
  { label: "Given name", width: "42%" },
  { label: "Date of birth", width: "34%" },
  { label: "City of birth", width: "46%" },
] as const;

export function PacketHero() {
  return (
    <div className="relative mx-auto h-72 w-full max-w-xs" aria-hidden="true">
      <div className="absolute inset-x-8 top-8 h-56 -rotate-6 rounded-sm border border-border bg-muted" />
      <div className="absolute inset-x-4 top-4 h-56 rotate-3 rounded-sm border border-border bg-card" />
      <div className="absolute inset-x-0 top-0 flex h-64 flex-col rounded-sm border border-foreground/20 bg-card px-5 py-4 shadow-md">
        <div className="flex items-baseline justify-between">
          <span className="type-title text-xl">I-130</span>
          <span className="text-[11px] uppercase tracking-wider text-foreground/60">Draft</span>
        </div>
        <div className="mt-5 space-y-3">
          {LINES.map((line) => (
            <div key={line.label}>
              <div className="text-[10px] uppercase tracking-wider text-foreground/55">{line.label}</div>
              <div className="mt-1 h-2 rounded-sm bg-foreground/80" style={{ width: line.width }} />
            </div>
          ))}
        </div>
        <div className="mt-auto flex gap-2 pt-4">
          <span className="h-3 w-3 rounded-sm border border-foreground bg-foreground" />
          <span className="h-3 flex-1 rounded-sm bg-foreground/15" />
        </div>
      </div>
    </div>
  );
}
