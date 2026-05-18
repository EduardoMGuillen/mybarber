import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { requireDb } from "@/lib/db";
import { shops, users } from "@/lib/db/schema";
import { ShopActions } from "./shop-actions";

type Props = { params: Promise<{ shopId: string }> };

export async function generateMetadata({ params }: Props) {
  const { shopId } = await params;
  try {
    const db = requireDb();
    const [shop] = await db
      .select({ name: shops.name })
      .from(shops)
      .where(eq(shops.id, shopId))
      .limit(1);
    return { title: shop?.name ?? "Barbería" };
  } catch {
    return { title: "Barbería" };
  }
}

export default async function AdminShopDetailPage({ params }: Props) {
  const { shopId } = await params;

  let row: {
    id: string;
    name: string;
    slug: string;
    status: string;
    trialEndsAt: Date;
    phone: string | null;
    formattedAddress: string | null;
    ownerEmail: string | null;
    ownerName: string | null;
    profileCompleteness: number;
  } | null = null;

  try {
    const db = requireDb();
    const [shop] = await db
      .select({
        id: shops.id,
        name: shops.name,
        slug: shops.slug,
        status: shops.status,
        trialEndsAt: shops.trialEndsAt,
        phone: shops.phone,
        formattedAddress: shops.formattedAddress,
        profileCompleteness: shops.profileCompleteness,
        ownerEmail: users.email,
        ownerName: users.name,
      })
      .from(shops)
      .leftJoin(users, eq(shops.ownerUserId, users.id))
      .where(eq(shops.id, shopId))
      .limit(1);
    row = shop ?? null;
  } catch {
    row = null;
  }

  if (!row) notFound();

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin" className="text-sm text-brand-text-muted hover:text-brand-gold">
          ← Barberías
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{row.name}</h1>
            <p className="text-brand-text-muted">
              <Link
                href={`/${row.slug}`}
                className="text-brand-gold hover:underline"
                target="_blank"
              >
                /{row.slug}
              </Link>
            </p>
          </div>
          <ShopActions shopId={row.id} status={row.status} />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="rounded-xl border border-white/10 bg-brand-surface p-6 space-y-3">
          <h2 className="font-semibold text-brand-gold">Estado</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-brand-text-muted">Estado</dt>
              <dd className="capitalize">{row.status}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-brand-text-muted">Trial hasta</dt>
              <dd>{row.trialEndsAt.toLocaleDateString("es-HN")}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-brand-text-muted">Perfil</dt>
              <dd>{row.profileCompleteness}%</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-white/10 bg-brand-surface p-6 space-y-3">
          <h2 className="font-semibold text-brand-gold">Dueño</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-brand-text-muted">Nombre</dt>
              <dd>{row.ownerName ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-brand-text-muted">Email</dt>
              <dd>{row.ownerEmail ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-brand-text-muted">Teléfono</dt>
              <dd>{row.phone ?? "—"}</dd>
            </div>
          </dl>
        </section>
      </div>

      {row.formattedAddress && (
        <p className="text-sm text-brand-text-muted">{row.formattedAddress}</p>
      )}
    </div>
  );
}
