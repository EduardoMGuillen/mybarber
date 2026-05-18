import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserPreferences } from "@/lib/actions/preferences";
import { ConfigNav } from "@/components/dashboard/config-nav";
import { PreferencesForm } from "@/components/dashboard/preferences-form";

export const metadata = { title: "Preferencias" };

export default async function PreferenciasPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const prefs = await getUserPreferences(session.user.id);

  return (
    <div>
      <ConfigNav current="/dashboard/configuracion/preferencias" />
      <h1 className="mb-6 text-2xl font-bold">Preferencias</h1>
      <PreferencesForm
        initial={{
          locale: prefs?.locale ?? "es",
          theme: prefs?.theme ?? "dark",
          emailNewBooking: prefs?.emailNewBooking ?? true,
          emailBookingConfirmed: prefs?.emailBookingConfirmed ?? true,
          emailTrialReminders: prefs?.emailTrialReminders ?? true,
          emailAppointmentReminder: prefs?.emailAppointmentReminder ?? true,
        }}
      />
    </div>
  );
}
