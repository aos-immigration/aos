import { NotSavedNotice } from "@/components/NotSavedNotice";

export default function PetitionerPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-end border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight mb-2">
            Petitioner Information
          </h1>
          <p className="text-muted-foreground text-sm max-w-xl">
            Provide details about the U.S. citizen or lawful permanent resident
            spouse filing this petition.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="px-2 py-1 bg-muted border border-border rounded text-[10px] font-mono text-muted-foreground">
            FORM: I-130
          </span>
          <span className="px-2 py-1 bg-muted border border-border rounded text-[10px] font-mono text-muted-foreground">
            REVISION: 04/01/24
          </span>
        </div>
      </div>
      <NotSavedNotice />

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
            <h3 className="font-medium text-sm">Identifiers</h3>
            <p className="text-xs text-muted-foreground">
              No A-Number or SSN is stored on this preview.
            </p>
          </div>
        </div>

        <div className="lg:col-span-3 border border-border p-6 rounded-xl bg-card">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-primary text-xl">📍</span>
            <h3 className="font-medium">Primary Residence History</h3>
          </div>
          <p className="text-sm text-muted-foreground">No address saved.</p>
        </div>
      </div>
    </div>
  );
}
