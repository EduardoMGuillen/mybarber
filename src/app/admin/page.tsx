import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { shops, users } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Superadmin" };

export default async function AdminPage() {
  let rows: {
    id: string;
    name: string;
    slug: string;
    status: string;
    trialEndsAt: Date;
    ownerEmail: string | null;
  }[] = [];

  try {
    const database = requireDb();
    rows = await database
      .select({
        id: shops.id,
        name: shops.name,
        slug: shops.slug,
        status: shops.status,
        trialEndsAt: shops.trialEndsAt,
        ownerEmail: users.email,
      })
      .from(shops)
      .leftJoin(users, eq(shops.ownerUserId, users.id))
      .orderBy(desc(shops.createdAt));
  } catch {
    rows = [];
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Barberías</h1>
          <p className="text-sm text-brand-text-muted">
            Gestiona todas las cuentas de MiBarbería
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/barberias/nueva">Nueva barbería</Link>
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/20 p-12 text-center text-brand-text-muted">
          <p>No hay barberías aún o falta configurar DATABASE_URL.</p>
          <p className="mt-2 text-sm">
            Ejecuta <code className="text-brand-gold">npm run db:migrate</code> y{" "}
            <code className="text-brand-gold">npm run db:seed</code>
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-brand-surface text-brand-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((shop) => (
                <tr key={shop.id} className="border-t border-white/10">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/barberias/${shop.id}`}
                      className="font-medium hover:text-brand-gold"
                    >
                      {shop.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-brand-text-muted">
                    /{shop.slug}
                  </td>
                  <td className="px-4 py-3">{shop.ownerEmail}</td>
                  <td className="px-4 py-3 capitalize">{shop.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
