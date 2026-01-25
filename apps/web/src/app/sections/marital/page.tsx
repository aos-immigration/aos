export default function MaritalPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-end border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">
            Marital History
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl">
            Provide details about your marriage and relationship history. This
            information is used to establish the validity of your marriage-based
            petition.
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
              Current Marriage
            </h2>
          </div>
          <div className="grid grid-cols-6 gap-x-6 gap-y-8 border-t border-border pt-8">
            <div className="col-span-3 space-y-2">
              <label className="block text-xs font-medium text-muted-foreground">
                Date of Marriage
              </label>
              <input
                className="w-full bg-card border border-border rounded-lg text-sm px-3 py-2 focus:ring-0 transition-all focus:border-primary"
                type="date"
              />
            </div>
            <div className="col-span-3 space-y-2">
              <label className="block text-xs font-medium text-muted-foreground">
                Place of Marriage
              </label>
              <input
                className="w-full bg-card border border-border rounded-lg text-sm px-3 py-2 focus:ring-0 transition-all focus:border-primary"
                placeholder="City, State, Country"
                type="text"
              />
            </div>
            <div className="col-span-6 space-y-2">
              <label className="block text-xs font-medium text-muted-foreground">
                Marriage Certificate Number
              </label>
              <input
                className="w-full bg-card border border-border rounded-lg text-sm px-3 py-2 focus:ring-0 transition-all focus:border-primary"
                placeholder="Certificate number"
                type="text"
              />
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="size-6 rounded border border-border flex items-center justify-center text-[10px] font-mono text-muted-foreground bg-card">
              02
            </span>
            <h2 className="text-sm font-semibold uppercase tracking-widest">
              Previous Marriages
            </h2>
          </div>
          <div className="border-t border-border pt-8">
            <div className="border border-dashed border-border p-6 rounded-xl bg-card/50">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium mb-1">Previous Marriages</h3>
                  <p className="text-xs text-muted-foreground">
                    If either party has been married before, provide details
                  </p>
                </div>
                <button className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
                  <span>+</span>
                  Add Previous Marriage
                </button>
              </div>
              <div className="text-sm text-muted-foreground italic">
                No previous marriages to report
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
