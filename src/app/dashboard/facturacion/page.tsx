import Link from "next/link";
import { redirect } from "next/navigation";
import { differenceInCalendarDays } from "date-fns";
import { auth } from "@/lib/auth";
import { getShopForUser } from "@/lib/tenant";
import { PayPalButton } from "@/components/dashboard/paypal-button";
import { TRIAL_DAYS } from "@/lib/constants";

export const metadata = { title: "Facturación" };

export default async function FacturacionPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const shop = await getShopForUser(
    session.user.id,
    session.user.role ?? "owner",
  );

  if (!shop) {
    return <p className="text-brand-text-muted">Sin barbería asociada.</p>;
  }

  const daysLeft = Math.max(
    0,
    differenceInCalendarDays(shop.trialEndsAt, new Date()),
  );
  const isTrial = shop.status === "trial";
  const billingExempt = shop.billingExempt;

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Facturación</h1>
        <p className="text-brand-text-muted">Plan y suscripción MiBarbería</p>
      </div>

      <div className="rounded-xl border border-brand-gold/30 bg-brand-gold/10 p-6 space-y-4">
        <p className="text-sm uppercase tracking-wide text-brand-gold">
          Estado: {shop.status}
        </p>
        {isTrial && !billingExempt && (
          <>
            <p className="text-3xl font-bold">
              {daysLeft}{" "}
              <span className="text-lg font-normal text-brand-text-muted">
                {daysLeft === 1 ? "día" : "días"} de prueba restantes
              </span>
            </p>
            <p className="text-sm text-brand-text-muted">
              Tu prueba de {TRIAL_DAYS} días termina el{" "}
              {shop.trialEndsAt.toLocaleDateString("es-HN", {
                dateStyle: "long",
              })}
              .
            </p>
          </>
        )}
        {billingExempt && (
          <p className="text-sm">Tu cuenta está exenta de facturación.</p>
        )}
        {shop.status === "active" && (
          <p className="text-sm text-green-400">Suscripción activa.</p>
        )}
        {shop.status === "pending_payment" && (
          <p className="text-sm text-amber-300">
            Tu prueba terminó. Activa PayPal para seguir publicando reservas.
          </p>
        )}
      </div>

      <div className="rounded-xl border border-white/10 bg-brand-surface p-6 space-y-4">
        <h2 className="font-semibold">$20 USD / mes</h2>
        <p className="text-sm text-brand-text-muted">
          Suscripción mensual segura con PayPal.
        </p>
        {!billingExempt && shop.status !== "active" && <PayPalButton />}
        <p className="text-center text-xs text-brand-text-muted">
          <Link href="/precios" className="text-brand-gold hover:underline">
            Ver detalles del plan
          </Link>
        </p>
      </div>
    </div>
  );
}
