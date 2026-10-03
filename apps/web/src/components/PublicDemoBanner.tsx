import { isPublicDemo } from "@/app/lib/demoPolicy";

export function PublicDemoBanner() {
  if (!isPublicDemo()) return null;
  return (
    <div className="sticky top-0 z-50 border-b border-amber-950/20 bg-amber-400 px-4 py-2 text-center text-sm text-amber-950">
      <p className="font-medium">{"Demo, fictional data only, don't enter real information."}</p>
      <p>
        Previews and downloads use the fictional Jordan Sampleton and Avery Exampleton packet.
      </p>
    </div>
  );
}
