import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { canAccessDashboard } from "@/lib/auth/guards";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!canAccessDashboard(session)) {
    redirect("/login");
  }

  if (session?.user?.role === "superadmin") {
    redirect("/admin");
  }

  return (
    <DashboardShell
      userName={session?.user?.name}
      userEmail={session?.user?.email}
    >
      {children}
    </DashboardShell>
  );
}
