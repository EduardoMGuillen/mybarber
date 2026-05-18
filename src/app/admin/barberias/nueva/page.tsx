"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShopForm } from "@/components/shops/shop-form";
import { createShopAsSuperadmin } from "@/lib/actions/shops";

export default function NuevaBarberiaPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-brand-text-muted hover:text-brand-gold">
          ← Volver
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Nueva barbería</h1>
        <p className="text-sm text-brand-text-muted">
          Crea la cuenta del dueño y la landing pública.
        </p>
      </div>
      <ShopForm
        showOwnerFields
        showAdminOptions
        submitLabel="Crear barbería"
        onSubmit={async (data) => {
          await createShopAsSuperadmin(data);
          router.push("/admin");
          router.refresh();
        }}
      />
    </div>
  );
}
