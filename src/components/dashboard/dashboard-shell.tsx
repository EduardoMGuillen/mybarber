"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string };

const mainNav: NavItem[] = [
  { href: "/dashboard", label: "Hoy" },
  { href: "/dashboard/reservas", label: "Reservas" },
  { href: "/dashboard/calendario", label: "Calendario" },
  { href: "/dashboard/enlace", label: "Mi enlace" },
  { href: "/dashboard/facturacion", label: "Facturación" },
];

const configNav: NavItem[] = [
  { href: "/dashboard/configuracion/perfil", label: "Perfil" },
  { href: "/dashboard/configuracion/servicios", label: "Servicios" },
  { href: "/dashboard/configuracion/equipo", label: "Equipo" },
  { href: "/dashboard/configuracion/preferencias", label: "Preferencias" },
  { href: "/dashboard/configuracion/seguridad", label: "Seguridad" },
];

function NavSection({
  items,
  pathname,
  onNavigate,
}: {
  items: NavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "rounded-lg px-3 py-2 text-sm transition-colors",
              active
                ? "bg-brand-gold/15 font-medium text-brand-gold"
                : "text-brand-text-muted hover:bg-white/5 hover:text-brand-text",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export function DashboardShell({
  children,
  userName,
  userEmail,
}: {
  children: React.ReactNode;
  userName?: string | null;
  userEmail?: string | null;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await signOut({ callbackUrl: "/", redirect: true });
  }

  const sidebar = (onNavigate?: () => void) => (
    <>
      <BrandLogo size="sm" href="/dashboard" showWordmark />
      <nav className="mt-8 flex flex-1 flex-col gap-6 overflow-y-auto">
        <div>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-brand-text-muted">
            Panel
          </p>
          <NavSection items={mainNav} pathname={pathname} onNavigate={onNavigate} />
        </div>
        <div>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-brand-text-muted">
            Configuración
          </p>
          <NavSection items={configNav} pathname={pathname} onNavigate={onNavigate} />
        </div>
      </nav>
      <div className="mt-auto border-t border-white/10 pt-4">
        <p className="truncate px-3 text-xs font-medium text-brand-text">
          {userName ?? "Barbero"}
        </p>
        {userEmail && (
          <p className="truncate px-3 text-[11px] text-brand-text-muted">{userEmail}</p>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2 w-full justify-start text-brand-text-muted hover:text-red-300"
          onClick={() => void handleSignOut()}
        >
          Cerrar sesión
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-full">
      <aside className="hidden w-60 shrink-0 border-r border-white/10 bg-brand-surface md:flex">
        <div className="flex h-full min-h-[100dvh] w-full flex-col p-4">
          {sidebar()}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/10 bg-brand-surface px-4 py-3 md:hidden">
          <BrandLogo size="sm" href="/dashboard" showWordmark />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-label="Menú"
          >
            {mobileOpen ? "Cerrar" : "Menú"}
          </Button>
        </header>

        {mobileOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              aria-label="Cerrar menú"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-brand-surface p-4 shadow-2xl md:hidden">
              {sidebar(() => setMobileOpen(false))}
            </aside>
          </>
        )}

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
