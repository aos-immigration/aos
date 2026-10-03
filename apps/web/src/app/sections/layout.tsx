import { DashboardLayout } from "@/components/DashboardLayout";
import { DisclaimerGate } from "@/components/intake/DisclaimerGate";

export default function SectionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout>
      <DisclaimerGate>{children}</DisclaimerGate>
    </DashboardLayout>
  );
}
