export default function BeneficiaryBiographicPage() {
  return (
    <div className="max-w-7xl mx-auto grid grid-cols-12 gap-12">
      <div className="col-span-12 lg:col-span-8">
        <header className="mb-12">
          <h1 className="text-3xl font-semibold tracking-tight mb-3">
            Beneficiary Biographic Details
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
            Provide physical characteristics and other identifying information
            for the beneficiary. Ensure all details match their passport and
            birth certificate exactly.
          </p>
        </header>

        <div className="space-y-16">
          <section className="space-y-8">
            <div className="flex items-center space-x-3 text-primary/80">
              <span className="text-sm">👤</span>
              <h2 className="uppercase tracking-widest text-[11px] font-bold">
                Physical Attributes
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="group">
                <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider group-focus-within:text-primary transition-colors">
                  Height (Feet)
                </label>
                <input
                  className="w-full bg-card border border-border rounded-lg px-4 py-3 outline-none transition-all text-lg font-light focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="e.g., 5"
                  type="text"
                />
              </div>
              <div className="group">
                <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider group-focus-within:text-primary transition-colors">
                  Height (Inches)
                </label>
                <input
                  className="w-full bg-card border border-border rounded-lg px-4 py-3 outline-none transition-all text-lg font-light focus:border-primary focus:ring-1 focus:ring-primary"
                  placeholder="e.g., 10"
                  type="text"
                />
              </div>
            </div>
            <div className="group">
              <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider group-focus-within:text-primary transition-colors">
                Weight (Pounds)
              </label>
              <input
                className="w-full bg-card border border-border rounded-lg px-4 py-3 outline-none transition-all text-lg font-light focus:border-primary focus:ring-1 focus:ring-primary"
                placeholder="e.g., 165"
                type="text"
              />
            </div>
          </section>

          <section className="space-y-8">
            <div className="flex items-center space-x-3 text-primary/80">
              <span className="text-sm">👁</span>
              <h2 className="uppercase tracking-widest text-[11px] font-bold">
                Distinguishing Traits
              </h2>
            </div>
            <div className="space-y-6">
              <div className="group">
                <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                  Eye Color
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button className="px-4 py-3 rounded-lg border border-border text-sm hover:border-primary/50 transition-colors text-left bg-card">
                    Black
                  </button>
                  <button className="px-4 py-3 rounded-lg border border-primary text-sm transition-colors text-left bg-primary/10 flex items-center justify-between">
                    Brown <span className="text-sm">✓</span>
                  </button>
                  <button className="px-4 py-3 rounded-lg border border-border text-sm hover:border-primary/50 transition-colors text-left bg-card">
                    Blue
                  </button>
                  <button className="px-4 py-3 rounded-lg border border-border text-sm hover:border-primary/50 transition-colors text-left bg-card">
                    Hazel
                  </button>
                </div>
              </div>
              <div className="group">
                <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                  Hair Color
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button className="px-4 py-3 rounded-lg border border-border text-sm hover:border-primary/50 transition-colors text-left bg-card">
                    Bald
                  </button>
                  <button className="px-4 py-3 rounded-lg border border-border text-sm hover:border-primary/50 transition-colors text-left bg-card">
                    Black
                  </button>
                  <button className="px-4 py-3 rounded-lg border border-border text-sm hover:border-primary/50 transition-colors text-left bg-card">
                    Blonde
                  </button>
                  <button className="px-4 py-3 rounded-lg border border-border text-sm hover:border-primary/50 transition-colors text-left bg-card">
                    Brown
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-8">
            <div className="flex items-center space-x-3 text-primary/80">
              <span className="text-sm">🌍</span>
              <h2 className="uppercase tracking-widest text-[11px] font-bold">
                Race & Ethnicity
              </h2>
            </div>
            <div className="space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-4 italic">
                  Select all that apply
                </p>
                <div className="space-y-3">
                  <label className="flex items-center p-4 rounded-lg border border-border bg-card cursor-pointer hover:bg-accent transition-all">
                    <input
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 mr-4"
                      type="checkbox"
                    />
                    <span className="text-sm">White</span>
                  </label>
                  <label className="flex items-center p-4 rounded-lg border border-border bg-card cursor-pointer hover:bg-accent transition-all">
                    <input
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 mr-4"
                      type="checkbox"
                    />
                    <span className="text-sm">Asian</span>
                  </label>
                  <label className="flex items-center p-4 rounded-lg border border-border bg-card cursor-pointer hover:bg-accent transition-all">
                    <input
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20 mr-4"
                      type="checkbox"
                    />
                    <span className="text-sm">Black or African American</span>
                  </label>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <aside className="hidden lg:block lg:col-span-4 h-fit sticky top-24">
        <div className="border border-border p-6 rounded-2xl bg-card/50 backdrop-blur-sm">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
              Helper Mode Active
            </span>
          </div>
          <div className="space-y-8">
            <div className="space-y-2">
              <h3 className="text-xs font-mono text-primary flex items-center">
                <span className="text-[16px] mr-2">💡</span>
                USCIS GUIDANCE
              </h3>
              <p className="text-[13px] leading-relaxed text-muted-foreground font-light">
                "Provide the race and ethnicity that you best identify with.
                This information is used for demographic purposes and background
                check verification."
              </p>
            </div>
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
              <h3 className="text-xs font-bold mb-2">Pro Tip</h3>
              <p className="text-[12px] leading-relaxed text-muted-foreground">
                Ensure your height is recorded in standard USCIS format
                (feet/inches). If your passport lists metric units, convert them
                precisely to avoid mismatch flags.
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
