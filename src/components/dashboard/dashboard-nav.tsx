"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function DashboardNav() {
  const t = useTranslations("nav");

  const links = [
    { href: "/dashboard", label: t("dashboard") },
    { href: "/dashboard/reservas", label: t("reservations") },
    { href: "/dashboard/calendario", label: t("calendar") },
    { href: "/dashboard/enlace", label: t("link") },
    { href: "/dashboard/configuracion/perfil", label: t("settings") },
    { href: "/dashboard/facturacion", label: t("billing") },
  ] as const;

  return (
    <nav className="mt-8 flex flex-col gap-1 text-sm">
      {links.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-lg px-3 py-2 text-brand-text-muted transition-colors hover:bg-white/5 hover:text-brand-text"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
