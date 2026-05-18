"use client";

import { useRouter } from "next/navigation";
import { ShopForm, type ShopFormData } from "@/components/shops/shop-form";
import { updateShopProfile } from "@/lib/actions/shops";

export function ProfileForm({
  initial,
  shopId,
}: {
  initial: Partial<ShopFormData>;
  shopId?: string;
}) {
  const router = useRouter();

  return (
    <ShopForm
      initial={initial}
      shopId={shopId}
      submitLabel="Guardar perfil"
      onSubmit={async (data) => {
        const result = await updateShopProfile(data);
        if (!result.ok) {
          throw new Error(result.error);
        }
        router.refresh();
      }}
    />
  );
}
