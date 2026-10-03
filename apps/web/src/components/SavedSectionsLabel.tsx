type SavedSectionsLabelProps = {
  saved: number;
  persistable: number;
};

export function SavedSectionsLabel({ saved, persistable }: SavedSectionsLabelProps) {
  return (
    <div className="text-[10px] font-mono text-muted-foreground leading-tight">
      <div>
        {saved} of {persistable} sections saved
      </div>
      <div>Other sections are not stored yet.</div>
    </div>
  );
}
