export default function SectionsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold tracking-tight mb-2">
        Your Application
      </h1>
      <p className="text-muted-foreground text-sm max-w-xl mb-8">
        Fill out your information step by step. We'll use this data to
        automatically complete all required immigration forms for you.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <div className="p-6 border border-border rounded-xl bg-card">
          <h3 className="font-medium mb-2">Personal Information</h3>
          <p className="text-sm text-muted-foreground">
            Start with basic details about yourself and your spouse.
          </p>
        </div>
        <div className="p-6 border border-border rounded-xl bg-card">
          <h3 className="font-medium mb-2">History & Background</h3>
          <p className="text-sm text-muted-foreground">
            Address, employment, and marital history information.
          </p>
        </div>
        <div className="p-6 border border-border rounded-xl bg-card">
          <h3 className="font-medium mb-2">Documents & Evidence</h3>
          <p className="text-sm text-muted-foreground">
            Upload and organize supporting documents.
          </p>
        </div>
      </div>
    </div>
  );
}
