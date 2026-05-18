import Image from "next/image";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { MarketingFooterExtras } from "@/components/marketing/marketing-footer-extras";
import { BRAND_LOGO_SRC } from "@/lib/brand";
import { Button } from "@/components/ui/button";

const features = [
  {
    title: "Landing con SEO",
    desc: "Tu página en mibarberia.dev/tu-barberia, lista para Google y redes.",
    icon: "✦",
  },
  {
    title: "Reservas multi-barbero",
    desc: "El cliente elige barbero o el primero disponible. Tú apruebas cada cita.",
    icon: "◎",
  },
  {
    title: "Panel del día",
    desc: "Reservas, calendario semanal y reservas manuales en un solo lugar.",
    icon: "▣",
  },
  {
    title: "WhatsApp y mapa",
    desc: "Enlace directo a WhatsApp y ubicación con mapa en tu landing.",
    icon: "⌁",
  },
  {
    title: "Equipo y servicios",
    desc: "Fotos de barberos, precios visibles y horarios por persona.",
    icon: "◈",
  },
  {
    title: "Prueba 7 días",
    desc: "Empieza gratis. Después $20 USD/mes con PayPal cuando estés listo.",
    icon: "★",
  },
];

const steps = [
  { n: "01", title: "Crea tu cuenta", desc: "Con Google o correo en menos de un minuto." },
  { n: "02", title: "Configura tu barbería", desc: "Ubicación, servicios, equipo y logo." },
  { n: "03", title: "Comparte tu enlace", desc: "QR y URL para que reserven al instante." },
];

export function HomeLanding() {
  return (
    <div className="page-shell marketing-page">
      <MarketingFooterExtras />
      <div className="hero-glow pointer-events-none fixed inset-0 -z-10" aria-hidden />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-brand-black/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-safe py-3 pt-safe sm:px-4 sm:py-4">
          <BrandLogo size="sm" href="/" showWordmark />
          <nav className="flex shrink-0 items-center gap-1.5 sm:gap-4">
            <Link
              href="/precios"
              className="hidden text-sm text-brand-text-muted hover:text-brand-text sm:inline"
            >
              Precios
            </Link>
            <Link
              href="/login"
              className="hidden text-sm text-brand-text-muted hover:text-brand-text min-[420px]:inline"
            >
              Entrar
            </Link>
            <Button asChild size="sm">
              <Link href="/registro">Empezar</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-4 sm:pb-20 sm:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="animate-fade-up space-y-6 text-center lg:text-left">
              <p className="inline-block rounded-full border border-brand-gold/30 bg-brand-gold/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-brand-gold animate-fade-up delay-1">
                Para barberías profesionales
              </p>
              <h1 className="animate-fade-up delay-2 text-3xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Tu barbería online con{" "}
                <span className="bg-gradient-to-r from-brand-gold-light to-brand-gold bg-clip-text text-transparent">
                  reservas en minutos
                </span>
              </h1>
              <p className="animate-fade-up delay-3 mx-auto max-w-xl text-lg text-brand-text-muted lg:mx-0">
                Landing con SEO, enlace de reservas, varios barberos y panel PWA.
                Sin complicaciones técnicas.
              </p>
              <div className="animate-fade-up delay-4 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
                <Button asChild size="lg" className="w-full shadow-lg shadow-brand-gold/20 sm:w-auto">
                  <Link href="/registro">Crear mi barbería — gratis</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                  <Link href="/precios">Ver precios</Link>
                </Button>
              </div>
              <p className="animate-fade-up delay-5 text-xs text-brand-text-muted">
                7 días de prueba · Sin tarjeta al registrarte
              </p>
            </div>

            <div className="animate-fade-up delay-3 relative mx-auto w-full max-w-md lg:max-w-none">
              <div className="landing-card-float rounded-2xl border border-brand-gold/20 bg-brand-surface/90 p-6 shadow-2xl shadow-brand-gold/10 backdrop-blur">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-brand-gold">Panel MiBarbería</span>
                  <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
                    En línea
                  </span>
                </div>
                <div className="space-y-3">
                  {["Nueva reserva — Carlos M.", "Corte + barba — 10:30", "Confirmada — Juan R."].map(
                    (line, i) => (
                      <div
                        key={line}
                        className="rounded-lg border border-white/10 bg-brand-black/50 px-4 py-3 text-sm animate-fade-up"
                        style={{ animationDelay: `${0.5 + i * 0.15}s` }}
                      >
                        {line}
                      </div>
                    ),
                  )}
                </div>
                <div className="mt-6 flex justify-center">
                  <Image
                    src={BRAND_LOGO_SRC}
                    alt="MiBarbería"
                    width={160}
                    height={160}
                    className="mx-auto h-32 w-32 object-contain opacity-90"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-brand-surface/50 py-12">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 text-center md:grid-cols-4">
            {[
              { v: "7 días", l: "Prueba gratis" },
              { v: "Multi", l: "Barberos" },
              { v: "SEO", l: "Landing incluida" },
              { v: "$20", l: "USD / mes" },
            ].map((stat, i) => (
              <div key={stat.l} className={`animate-fade-up delay-${i + 1}`}>
                <p className="text-2xl font-bold text-brand-gold sm:text-3xl">{stat.v}</p>
                <p className="mt-1 text-sm text-brand-text-muted">{stat.l}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">Todo lo que necesitas</h2>
            <p className="mt-3 text-brand-text-muted">
              Diseñado para barberías en Honduras y Latinoamérica
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <article
                key={f.title}
                className={`landing-feature-card animate-fade-up delay-${(i % 3) + 1} rounded-2xl border border-white/10 bg-brand-surface p-6 transition hover:border-brand-gold/30`}
              >
                <span className="text-2xl text-brand-gold">{f.icon}</span>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-brand-text-muted">{f.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-white/10 bg-gradient-to-b from-brand-surface/30 to-transparent py-20">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-center text-3xl font-bold">Cómo funciona</h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {steps.map((s, i) => (
                <div
                  key={s.n}
                  className={`relative animate-fade-up delay-${i + 2} rounded-2xl border border-white/10 p-6`}
                >
                  <span className="text-4xl font-bold text-brand-gold/40">{s.n}</span>
                  <h3 className="mt-4 text-xl font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm text-brand-text-muted">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-20 text-center">
          <div className="animate-fade-up rounded-3xl border border-brand-gold/30 bg-brand-gold/10 p-10 sm:p-14">
            <h2 className="text-3xl font-bold">¿Listo para llenar tu agenda?</h2>
            <p className="mt-4 text-brand-text-muted">
              Únete a barberías que ya usan MiBarbería para verse profesionales y recibir
              reservas 24/7.
            </p>
            <Button asChild size="lg" className="mt-8">
              <Link href="/registro">Empezar mi prueba gratis</Link>
            </Button>
          </div>
        </section>
      </main>

    </div>
  );
}
