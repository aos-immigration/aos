import { cookies } from "next/headers";
import { DashboardLayout } from "@/components/DashboardLayout";
import { IntakeModeProvider } from "@/app/lib/intakeMode";
import { DEMO_COOKIE } from "@/app/lib/demoCouple";

export default async function FormsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const demo = (await cookies()).get(DEMO_COOKIE)?.value === "1";
  return (
    <IntakeModeProvider demo={demo}>
      <DashboardLayout>{children}</DashboardLayout>
    </IntakeModeProvider>
  );
}
