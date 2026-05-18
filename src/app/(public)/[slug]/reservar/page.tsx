import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { BookingWizard } from "@/components/booking/booking-wizard";
import { requireDb } from "@/lib/db";
import { services, shopStaff } from "@/lib/db/schema";
import { getShopBySlug, isShopPubliclyAccessible } from "@/lib/tenant";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);
  return { title: shop ? `Reservar · ${shop.name}` : "Reservar" };
}

export default async function ReservarPage({ params }: Props) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);

  if (!shop) notFound();
  if (!isShopPubliclyAccessible(shop)) {
    redirect(`/${slug}/no-disponible`);
  }

  const db = requireDb();
  const [svc, team] = await Promise.all([
    db
      .select({
        id: services.id,
        name: services.name,
        durationMinutes: services.durationMinutes,
        priceDisplay: services.priceDisplay,
      })
      .from(services)
      .where(and(eq(services.shopId, shop.id), eq(services.active, true)))
      .orderBy(services.sortOrder),
    db
      .select({
        id: shopStaff.id,
        displayName: shopStaff.displayName,
      })
      .from(shopStaff)
      .where(
        and(
          eq(shopStaff.shopId, shop.id),
          eq(shopStaff.active, true),
          eq(shopStaff.acceptsOnlineBookings, true),
        ),
      )
      .orderBy(shopStaff.sortOrder),
  ]);

  if (svc.length === 0) {
    redirect(`/${slug}/no-disponible`);
  }

  return (
    <div className="page-shell bg-brand-black">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-lg items-center justify-between px-safe py-3 pt-safe">
          <Link
            href={`/${slug}`}
            className="text-sm text-brand-text-muted hover:text-brand-gold"
          >
            ← {shop.name}
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-6 pb-safe sm:py-8">
        <h1 className="mb-6 text-2xl font-bold">Reservar cita</h1>
        <BookingWizard
          slug={slug}
          shopName={shop.name}
          timezone={shop.timezone}
          maxDaysAhead={shop.maxDaysAhead}
          services={svc}
          staff={team}
        />
      </main>
    </div>
  );
}

