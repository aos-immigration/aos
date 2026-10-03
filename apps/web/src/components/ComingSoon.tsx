import { NotSavedNotice } from "@/components/NotSavedNotice";

type ComingSoonProps = {
  title: string;
};

export function ComingSoon({ title }: ComingSoonProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground text-sm">This section is not available yet.</p>
      <NotSavedNotice />
    </div>
  );
}
