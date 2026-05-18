import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { BrandLogo } from "@/components/brand/brand-logo";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
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
    <div className="flex min-h-full">
      <aside className="hidden w-56 shrink-0 border-r border-white/10 bg-brand-surface md:block">
        <div className="flex h-full flex-col p-4">
          <BrandLogo size="sm" href="/dashboard" />
          <DashboardNav />
          <nav className="mt-4 flex flex-col gap-1 border-t border-white/10 pt-4 text-sm">
            <SubNavLink href="/dashboard/configuracion/servicios">Servicios</SubNavLink>
            <SubNavLink href="/dashboard/configuracion/equipo">Equipo</SubNavLink>
            <SubNavLink href="/dashboard/configuracion/preferencias">Preferencias</SubNavLink>
          </nav>
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="border-b border-white/10 px-4 py-3 md:hidden">
          <BrandLogo size="sm" href="/dashboard" />
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}

function SubNavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg px-3 py-2 text-brand-text-muted transition-colors hover:bg-white/5 hover:text-brand-text"
    >
      {children}
    </Link>
  );
}
