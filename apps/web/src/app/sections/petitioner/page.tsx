export default function PetitionerPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-end border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">
            Petitioner Information
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl">
            Tell us about yourself. This information will be used across all
            required forms automatically.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 border border-border p-6 rounded-xl space-y-6 bg-card">
          <div className="flex items-center gap-3">
            <span className="text-primary text-xl">👤</span>
            <h3 className="font-medium">Legal Identity</h3>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Legal First Name
              </label>
              <input
                className="w-full bg-transparent border-b border-border focus:border-primary focus:ring-0 transition-all py-2 text-sm placeholder:text-muted-foreground"
                placeholder="John"
                type="text"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Legal Last Name
              </label>
              <input
                className="w-full bg-transparent border-b border-border focus:border-primary focus:ring-0 transition-all py-2 text-sm placeholder:text-muted-foreground"
                placeholder="Doe"
                type="text"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Middle Name (If any)
              </label>
              <input
                className="w-full bg-transparent border-b border-border focus:border-primary focus:ring-0 transition-all py-2 text-sm placeholder:text-muted-foreground"
                placeholder="Quincy"
                type="text"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Date of Birth
              </label>
              <input
                className="w-full bg-transparent border-b border-border focus:border-primary focus:ring-0 transition-all py-2 text-sm placeholder:text-muted-foreground"
                type="date"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Place of Birth
              </label>
              <input
                className="w-full bg-transparent border-b border-border focus:border-primary focus:ring-0 transition-all py-2 text-sm placeholder:text-muted-foreground"
                placeholder="City, Country"
                type="text"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Citizenship Status
              </label>
              <select className="w-full bg-transparent border-b border-border focus:border-primary focus:ring-0 transition-all py-2 text-sm">
                <option>U.S. Citizen</option>
                <option>Lawful Permanent Resident</option>
              </select>
            </div>
            <div className="space-y-2 col-span-2">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Alias / Other Names Used
              </label>
              <div className="flex items-center gap-2 border-b border-border py-2">
                <span className="text-xs text-muted-foreground italic">
                  No other names added
                </span>
                <button className="ml-auto text-[10px] bg-muted px-2 py-0.5 rounded border border-border hover:bg-accent">
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border border-border p-6 rounded-xl space-y-4 bg-card">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Progress</h3>
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
            </div>
            <div className="space-y-3 font-mono text-[11px]">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">A-Number:</span>
                <span className="text-foreground">A-234 567 890</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">SSN:</span>
                <span className="text-foreground">XXX-XX-4421</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Last Saved:</span>
                <span className="text-foreground">2024-05-12 14:22</span>
              </div>
            </div>
          </div>

          <div className="border border-border p-6 rounded-xl space-y-4 bg-card">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Required Documents
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-muted rounded border border-border">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-green-500">✓</span>
                  <span className="text-xs">U.S. Birth Certificate</span>
                </div>
                <span className="text-xs text-muted-foreground">👁</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded border border-border">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-amber-500">⏳</span>
                  <span className="text-xs">Passport</span>
                </div>
                <span className="text-xs text-primary">📤</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
