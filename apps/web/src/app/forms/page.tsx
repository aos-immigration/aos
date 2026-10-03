import { NotSavedNotice } from "@/components/NotSavedNotice";

export default function FormsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight mb-2">Forms</h1>
      <p className="text-muted-foreground text-sm max-w-xl">
        These previews do not save. The sidebar does not open them. Petitioner
        basics, under Petitioner Information, is the form that stores data.
      </p>
      <NotSavedNotice />
    </div>
  );
}
