import { escapeHtml, formatDateTime, getAppUrl, renderEmailLayout } from "@/lib/emails/layout";

export function bookingShopEmailHtml(input: {
  shopName: string;
  appointmentId: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  serviceName: string;
  staffName: string;
  startAt: Date;
  timezone: string;
  recipientName?: string | null;
}) {
  const when = formatDateTime(input.startAt, input.timezone);
  const panelUrl = `${getAppUrl()}/dashboard/reservas?highlight=${input.appointmentId}`;
  const phoneDigits = input.clientPhone.replace(/\D/g, "");
  const phoneLink = phoneDigits
    ? `<a href="tel:${escapeHtml(phoneDigits)}" style="color:#e8c547;text-decoration:none;">${escapeHtml(input.clientPhone)}</a>`
    : escapeHtml(input.clientPhone);
  const emailLink = `<a href="mailto:${escapeHtml(input.clientEmail)}" style="color:#e8c547;text-decoration:none;">${escapeHtml(input.clientEmail)}</a>`;

  const greeting = input.recipientName
    ? `Hola <strong style="color:#f5f5f5;">${escapeHtml(input.recipientName)}</strong>, tienes una nueva solicitud de reserva en <strong style="color:#f5f5f5;">${escapeHtml(input.shopName)}</strong>.`
    : `Nueva solicitud de reserva en <strong style="color:#f5f5f5;">${escapeHtml(input.shopName)}</strong>.`;

  return renderEmailLayout({
    preheader: `Nueva reserva: ${input.clientName} — ${when}`,
    eyebrow: "Nueva reserva",
    title: "Cliente esperando confirmación",
    introHtml: greeting,
    details: [
      { label: "Cliente", value: escapeHtml(input.clientName) },
      { label: "Teléfono", value: phoneLink, html: true },
      { label: "Correo", value: emailLink, html: true },
      { label: "Servicio", value: escapeHtml(input.serviceName) },
      { label: "Barbero", value: escapeHtml(input.staffName) },
      { label: "Fecha y hora", value: escapeHtml(when) },
    ],
    noticeHtml: `Aprueba o rechaza la cita desde el panel. El cliente recibirá aviso por correo.`,
    cta: { label: "Gestionar reserva", href: panelUrl },
    footerNote: "Recibes este correo porque gestionas reservas en MiBarbería.",
  });
}
