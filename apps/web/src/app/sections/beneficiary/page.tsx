export default function BeneficiaryPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-end border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">
            Beneficiary Information
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl">
            Tell us about the person you're sponsoring. This information will
            be used across all required forms automatically.
          </p>
        </div>
      </div>

      <div className="space-y-16">
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="size-6 rounded border border-border flex items-center justify-center text-[10px] font-mono text-muted-foreground bg-card">
              01
            </span>
            <h2 className="text-sm font-semibold uppercase tracking-widest">
              Legal Identity
            </h2>
          </div>
          <div className="grid grid-cols-6 gap-x-6 gap-y-8 border-t border-border pt-8">
            <div className="col-span-3 space-y-2">
              <label className="block text-xs font-medium text-muted-foreground">
                First Name (Given Name)
              </label>
              <input
                className="w-full bg-card border border-border rounded-lg text-sm px-3 py-2 focus:ring-0 transition-all focus:border-primary"
                placeholder="Jane"
                type="text"
              />
            </div>
            <div className="col-span-3 space-y-2">
              <label className="block text-xs font-medium text-muted-foreground">
                Last Name (Family Name)
              </label>
              <input
                className="w-full bg-card border border-border rounded-lg text-sm px-3 py-2 focus:ring-0 transition-all focus:border-primary"
                placeholder="Smith"
                type="text"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="block text-xs font-medium text-muted-foreground">
                Date of Birth
              </label>
              <input
                className="w-full bg-card border border-border rounded-lg text-sm px-3 py-2 focus:ring-0 transition-all focus:border-primary"
                type="date"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="block text-xs font-medium text-muted-foreground">
                Place of Birth
              </label>
              <input
                className="w-full bg-card border border-border rounded-lg text-sm px-3 py-2 focus:ring-0 transition-all focus:border-primary"
                placeholder="City, Country"
                type="text"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <label className="block text-xs font-medium text-muted-foreground">
                Gender
              </label>
              <select className="w-full bg-card border border-border rounded-lg text-sm px-3 py-2 focus:ring-0 transition-all focus:border-primary">
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
              </select>
            </div>
            <div className="col-span-6 flex items-center justify-between p-4 bg-muted rounded-xl border border-border">
              <div>
                <p className="text-sm font-medium">Any other names used?</p>
                <p className="text-xs text-muted-foreground">
                  Include maiden names or previous legal aliases.
                </p>
              </div>
              <div className="flex bg-background p-1 rounded-lg border border-border">
                <button className="px-4 py-1.5 text-xs font-medium rounded hover:bg-accent text-muted-foreground">
                  Yes
                </button>
                <button className="px-4 py-1.5 text-xs font-medium rounded bg-border text-foreground shadow-sm">
                  No
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
