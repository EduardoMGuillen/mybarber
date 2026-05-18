import Image from "next/image";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { requireDb } from "@/lib/db";
import {
  businessHours,
  services,
  shopStaff,
} from "@/lib/db/schema";
import { buildLocalBusinessJsonLd } from "@/lib/seo/local-business-jsonld";
import { generateShopMetadata } from "@/lib/seo/generate-metadata";
import { getShopBySlug, isShopPubliclyAccessible } from "@/lib/tenant";
import {
  buildDirectionsUrl,
  buildOsmEmbedUrl,
} from "@/lib/maps/embed-url";

const DAY_LABELS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop) return { title: "Barbería" };
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return generateShopMetadata(shop, appUrl);
}

export default async function ShopLandingPage({ params }: Props) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);

  if (!shop) notFound();
  if (!isShopPubliclyAccessible(shop)) {
    redirect(`/${slug}/no-disponible`);
  }

  const db = requireDb();
  const [svc, team, hours] = await Promise.all([
    db
      .select()
      .from(services)
      .where(and(eq(services.shopId, shop.id), eq(services.active, true)))
      .orderBy(services.sortOrder),
    db
      .select({
        id: shopStaff.id,
        displayName: shopStaff.displayName,
        photoUrl: shopStaff.photoUrl,
        bio: shopStaff.bio,
      })
      .from(shopStaff)
      .where(and(eq(shopStaff.shopId, shop.id), eq(shopStaff.active, true)))
      .orderBy(shopStaff.sortOrder),
    db
      .select()
      .from(businessHours)
      .where(eq(businessHours.shopId, shop.id))
      .orderBy(businessHours.dayOfWeek),
  ]);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const jsonLd = buildLocalBusinessJsonLd(
    shop,
    hours,
    svc.map((s) => ({ name: s.name, priceDisplay: s.priceDisplay })),
    appUrl,
  );

  const mapSrc =
    shop.lat && shop.lng ? buildOsmEmbedUrl(String(shop.lat), String(shop.lng)) : "";
  const directionsUrl =
    shop.lat && shop.lng
      ? buildDirectionsUrl(String(shop.lat), String(shop.lng))
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="page-shell bg-brand-black">
        <header className="border-b border-white/10">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-safe py-3 pt-safe">
            <div className="flex items-center gap-3">
              {shop.logoUrl && (
                <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-white/10">
                  <Image
                    src={shop.logoUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="40px"
                    unoptimized
                  />
                </div>
              )}
              <h1 className="text-xl font-bold">{shop.name}</h1>
            </div>
            <Button asChild size="sm">
              <Link href={`/${slug}/reservar`}>Reservar</Link>
            </Button>
          </div>
        </header>

        <main className="mx-auto max-w-4xl space-y-16 px-4 py-12">
          <section className="space-y-4 text-center">
            {shop.logoUrl && (
              <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-2xl border border-brand-gold/30">
                <Image
                  src={shop.logoUrl}
                  alt={shop.name}
                  fill
                  className="object-cover"
                  sizes="96px"
                  unoptimized
                  priority
                />
              </div>
            )}
            <p className="text-sm font-medium uppercase tracking-widest text-brand-gold">
              Barbería
            </p>
            <h2 className="text-3xl font-bold sm:text-4xl">{shop.name}</h2>
            <p className="mx-auto max-w-2xl text-brand-text-muted">
              {shop.description}
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Button asChild size="lg">
                <Link href={`/${slug}/reservar`}>Reservar cita</Link>
              </Button>
              {shop.whatsappNumber && (
                <Button asChild variant="outline" size="lg">
                  <a
                    href={`https://wa.me/${shop.whatsappNumber.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    WhatsApp
                  </a>
                </Button>
              )}
            </div>
          </section>

          {svc.length > 0 && (
            <section className="space-y-6">
              <h3 className="text-xl font-semibold text-brand-gold">Servicios</h3>
              <ul className="grid gap-3 sm:grid-cols-2">
                {svc.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-xl border border-white/10 bg-brand-surface p-4"
                  >
                    <p className="font-medium">{s.name}</p>
                    <p className="text-sm text-brand-text-muted">
                      {s.durationMinutes} min
                      {s.priceDisplay ? ` · ${s.priceDisplay}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {team.length > 0 && (
            <section className="space-y-6">
              <h3 className="text-xl font-semibold text-brand-gold">Equipo</h3>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {team.map((m) => (
                  <article
                    key={m.id}
                    className="rounded-xl border border-white/10 bg-brand-surface p-4 text-center"
                  >
                    <div className="relative mx-auto mb-3 h-20 w-20 overflow-hidden rounded-full border border-white/10 bg-brand-black">
                      {m.photoUrl ? (
                        <Image
                          src={m.photoUrl}
                          alt={m.displayName}
                          fill
                          className="object-cover"
                          sizes="80px"
                          unoptimized
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-2xl font-bold text-brand-gold">
                          {m.displayName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <p className="font-medium">{m.displayName}</p>
                    {m.bio && (
                      <p className="mt-1 text-sm text-brand-text-muted">{m.bio}</p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          {hours.length > 0 && (
            <section className="space-y-6">
              <h3 className="text-xl font-semibold text-brand-gold">Horarios</h3>
              <ul className="rounded-xl border border-white/10 bg-brand-surface divide-y divide-white/10">
                {hours.map((h) => (
                  <li
                    key={h.id}
                    className="flex justify-between px-4 py-3 text-sm"
                  >
                    <span>{DAY_LABELS[h.dayOfWeek]}</span>
                    <span className="text-brand-text-muted">
                      {h.isClosed
                        ? "Cerrado"
                        : `${h.openTime} – ${h.closeTime}`}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {mapSrc && (
            <section className="space-y-4">
              <h3 className="text-xl font-semibold text-brand-gold">Ubicación</h3>
              <p className="text-sm text-brand-text-muted">
                {shop.formattedAddress}
              </p>
              {directionsUrl && (
                <Button asChild variant="outline" size="sm">
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Cómo llegar
                  </a>
                </Button>
              )}
              <div className="aspect-video overflow-hidden rounded-xl border border-white/10">
                <iframe
                  title={`Mapa de ${shop.name}`}
                  src={mapSrc}
                  className="h-full w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </section>
          )}
        </main>

        <footer className="border-t border-white/10 py-8 text-center text-xs text-brand-text-muted">
          Reservas con{" "}
          <Link href="/" className="text-brand-gold hover:underline">
            MiBarbería
          </Link>
        </footer>
      </div>
    </>
  );
}
