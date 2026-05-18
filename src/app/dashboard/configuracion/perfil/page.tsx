import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getShopForUser } from "@/lib/tenant";
import { ConfigNav } from "@/components/dashboard/config-nav";
import { ProfileForm } from "@/components/dashboard/profile-form";

export const metadata = { title: "Perfil" };

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const shop = await getShopForUser(
    session.user.id,
    session.user.role ?? "owner",
  );

  if (!shop) {
    return (
      <div>
        <ConfigNav current="/dashboard/configuracion/perfil" />
        <p className="text-brand-text-muted">
          Aún no tienes barbería.{" "}
          <a href="/onboarding" className="text-brand-gold hover:underline">
            Completar onboarding
          </a>
        </p>
      </div>
    );
  }

  return (
    <div>
      <ConfigNav current="/dashboard/configuracion/perfil" />
      <h1 className="mb-6 text-2xl font-bold">Perfil de la barbería</h1>
      <ProfileForm
        initial={{
          name: shop.name,
          slug: shop.slug,
          description: shop.description ?? "",
          phone: shop.phone ?? "",
          whatsappNumber: shop.whatsappNumber ?? "",
          addressLine1: shop.addressLine1 ?? "",
          addressLine2: shop.addressLine2 ?? "",
          city: shop.city ?? "",
          state: shop.state ?? "",
          country: shop.country,
          postalCode: shop.postalCode ?? "",
          formattedAddress: shop.formattedAddress ?? "",
          googlePlaceId: shop.googlePlaceId ?? "",
          lat: shop.lat ?? "",
          lng: shop.lng ?? "",
          timezone: shop.timezone,
          instagramUrl: shop.instagramUrl ?? "",
        }}
      />
    </div>
  );
}
