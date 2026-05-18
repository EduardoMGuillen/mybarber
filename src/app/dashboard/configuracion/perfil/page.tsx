import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getShopForUser } from "@/lib/tenant";
import { ProfileForm } from "@/components/dashboard/profile-form";
import { OnboardingSetup } from "@/components/dashboard/onboarding-setup";

export const metadata = { title: "Perfil de la barbería" };

export default async function PerfilPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const shop = await getShopForUser(
    session.user.id,
    session.user.role ?? "owner",
  );

  if (!shop) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Configura tu barbería</h1>
          <p className="mt-2 text-brand-text-muted">
            Completa estos datos para publicar tu landing y enlace de reservas. El menú
            lateral sigue disponible mientras configuras.
          </p>
        </div>
        <OnboardingSetup />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Perfil de la barbería</h1>
        <p className="mt-1 text-sm text-brand-text-muted">
          Datos públicos, logo, ubicación y contacto.
        </p>
      </div>
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
          logoUrl: shop.logoUrl ?? "",
        }}
      />
    </div>
  );
}
