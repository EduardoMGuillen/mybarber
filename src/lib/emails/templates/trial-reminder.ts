import { escapeHtml, getAppUrl, renderEmailLayout } from "@/lib/emails/layout";

export function trialReminderEmailHtml(input: {
  ownerName?: string | null;
  shopName: string;
  trialEndsAt: Date;
}) {
  const ends = input.trialEndsAt.toLocaleDateString("es-HN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const billingUrl = `${getAppUrl()}/dashboard/facturacion`;

  const greeting = input.ownerName
    ? `Hola <strong style="color:#f5f5f5;">${escapeHtml(input.ownerName)}</strong>,`
    : "Hola,";

  return renderEmailLayout({
    preheader: `Tu prueba de ${input.shopName} termina pronto`,
    eyebrow: "Suscripción",
    title: "Tu prueba termina pronto",
    introHtml: `${greeting}<br/><br/>La prueba gratuita de <strong style="color:#f5f5f5;">${escapeHtml(input.shopName)}</strong> en MiBarbería está por finalizar.`,
    details: [
      { label: "Barbería", value: escapeHtml(input.shopName) },
      { label: "Fin de prueba", value: escapeHtml(ends) },
    ],
    noticeHtml: `Activa tu suscripción para seguir recibiendo reservas en línea, panel y landing pública sin interrupciones.`,
    cta: { label: "Activar suscripción", href: billingUrl },
  });
}
