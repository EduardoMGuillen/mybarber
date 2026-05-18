"use client";

import { useRouter } from "next/navigation";
import { ShopForm, type ShopFormData } from "@/components/shops/shop-form";
import { updateShopProfile } from "@/lib/actions/shops";

export function ProfileForm({ initial }: { initial: Partial<ShopFormData> }) {
  const router = useRouter();

  return (
    <ShopForm
      initial={initial}
      submitLabel="Guardar perfil"
      onSubmit={async (data) => {
        await updateShopProfile(data);
        router.refresh();
      }}
    />
  );
}
