export default function PetitionerAddressPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-end border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">
            Petitioner Address History
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl">
            Provide your address history for the past 5 years. Include all
            addresses where you have lived, even if temporary.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="border border-border p-6 rounded-xl bg-card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-primary text-xl">📍</span>
              <h3 className="font-medium">Current Address</h3>
            </div>
            <span className="px-2 py-0.5 bg-green-500/10 text-green-500 text-[10px] rounded border border-green-500/20">
              Current
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Street Address
              </label>
              <input
                className="w-full bg-transparent border-b border-border focus:border-primary focus:ring-0 transition-all py-2 text-sm placeholder:text-muted-foreground"
                placeholder="742 Evergreen Terrace"
                type="text"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                City
              </label>
              <input
                className="w-full bg-transparent border-b border-border focus:border-primary focus:ring-0 transition-all py-2 text-sm placeholder:text-muted-foreground"
                placeholder="Springfield"
                type="text"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                State
              </label>
              <input
                className="w-full bg-transparent border-b border-border focus:border-primary focus:ring-0 transition-all py-2 text-sm placeholder:text-muted-foreground"
                placeholder="IL"
                type="text"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                ZIP Code
              </label>
              <input
                className="w-full bg-transparent border-b border-border focus:border-primary focus:ring-0 transition-all py-2 text-sm placeholder:text-muted-foreground"
                placeholder="62704"
                type="text"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Date From
              </label>
              <input
                className="w-full bg-transparent border-b border-border focus:border-primary focus:ring-0 transition-all py-2 text-sm placeholder:text-muted-foreground"
                type="date"
              />
            </div>
          </div>
        </div>

        <div className="border border-dashed border-border p-6 rounded-xl bg-card/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium mb-1">Previous Addresses</h3>
              <p className="text-xs text-muted-foreground">
                Add all addresses from the past 5 years
              </p>
            </div>
            <button className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
              <span>+</span>
              Add Previous Address
            </button>
          </div>
          <div className="text-sm text-muted-foreground italic">
            No previous addresses added yet
          </div>
        </div>
      </div>
    </div>
  );
}
