import Link from "next/link";

const links = [
  { href: "/dashboard/configuracion/perfil", label: "Perfil" },
  { href: "/dashboard/configuracion/servicios", label: "Servicios" },
  { href: "/dashboard/configuracion/preferencias", label: "Preferencias" },
  { href: "/dashboard/configuracion/seguridad", label: "Seguridad" },
];

export function ConfigNav({ current }: { current: string }) {
  return (
    <nav className="mb-8 flex flex-wrap gap-2 border-b border-white/10 pb-4">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
            current === link.href
              ? "bg-brand-gold/20 text-brand-gold"
              : "text-brand-text-muted hover:bg-white/5 hover:text-brand-text"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
