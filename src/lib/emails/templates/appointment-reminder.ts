import { escapeHtml, formatDateTime, getAppUrl, renderEmailLayout } from "@/lib/emails/layout";

export function appointmentReminderEmailHtml(input: {
  clientName: string;
  shopName: string;
  shopSlug: string;
  serviceName: string;
  staffName: string;
  startAt: Date;
  timezone: string;
  shopAddress?: string | null;
}) {
  const when = formatDateTime(input.startAt, input.timezone);
  const shopUrl = `${getAppUrl()}/${input.shopSlug}`;

  return renderEmailLayout({
    preheader: `Recordatorio: tu cita en ${input.shopName} es mañana`,
    eyebrow: "Recordatorio",
    title: "Tu cita es mañana",
    introHtml: `Hola <strong style="color:#f5f5f5;">${escapeHtml(input.clientName)}</strong>, te recordamos tu cita confirmada en <strong style="color:#f5f5f5;">${escapeHtml(input.shopName)}</strong>.`,
    details: [
      { label: "Servicio", value: escapeHtml(input.serviceName) },
      { label: "Barbero", value: escapeHtml(input.staffName) },
      { label: "Fecha y hora", value: escapeHtml(when) },
      ...(input.shopAddress
        ? [{ label: "Ubicación", value: escapeHtml(input.shopAddress) }]
        : []),
    ],
    noticeHtml: `Llega unos minutos antes. Si no puedes asistir, avisa a la barbería lo antes posible.`,
    cta: { label: "Ver barbería", href: shopUrl },
  });
}
