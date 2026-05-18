import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getShopBusinessHoursForOwner } from "@/lib/actions/business-hours";
import { BusinessHoursPanel } from "@/components/dashboard/business-hours-panel";

export const metadata = { title: "Horario" };

export default async function HorarioPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const data = await getShopBusinessHoursForOwner();
  if (!data) {
    redirect("/dashboard/configuracion/perfil");
  }

  if (session.user.role !== "owner") {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Horario</h1>
        <p className="mt-1 text-sm text-brand-text-muted">
          Días y horas en que la barbería atiende y acepta reservas en línea.
        </p>
      </div>
      <BusinessHoursPanel initial={data.hours} />
    </div>
  );
}
