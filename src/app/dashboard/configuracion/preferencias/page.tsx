import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserPreferences } from "@/lib/actions/preferences";
import { PreferencesForm } from "@/components/dashboard/preferences-form";
import { PushNotifications } from "@/components/dashboard/push-notifications";

export const metadata = { title: "Preferencias" };

export default async function PreferenciasPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const prefs = await getUserPreferences(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Preferencias</h1>
        <p className="mt-1 text-sm text-brand-text-muted">
          Idioma, correos y notificaciones push.
        </p>
      </div>
      <div className="max-w-lg space-y-8">
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
        <PushNotifications
          initialEnabled={prefs?.pushEnabled ?? false}
          vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY}
        />
      </div>
    </div>
  );
}
