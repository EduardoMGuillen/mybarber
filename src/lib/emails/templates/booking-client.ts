import { escapeHtml, formatDateTime, getAppUrl, renderEmailLayout } from "@/lib/emails/layout";

export function bookingClientEmailHtml(input: {
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
  const appUrl = getAppUrl();
  const shopUrl = `${appUrl}/${input.shopSlug}`;

  return renderEmailLayout({
    preheader: `Solicitud recibida en ${input.shopName} — ${when}`,
    eyebrow: "Reserva recibida",
    title: "Tu solicitud está en camino",
    introHtml: `Hola <strong style="color:#f5f5f5;">${escapeHtml(input.clientName)}</strong>, recibimos tu solicitud en <strong style="color:#f5f5f5;">${escapeHtml(input.shopName)}</strong>.`,
    details: [
      { label: "Barbería", value: escapeHtml(input.shopName) },
      { label: "Servicio", value: escapeHtml(input.serviceName) },
      { label: "Barbero", value: escapeHtml(input.staffName) },
      { label: "Fecha y hora", value: escapeHtml(when) },
      ...(input.shopAddress
        ? [{ label: "Ubicación", value: escapeHtml(input.shopAddress) }]
        : []),
    ],
    noticeHtml: `<strong style="color:#e8c547;">Pendiente de confirmación.</strong> El equipo revisará tu cita y te avisaremos por correo cuando quede confirmada. Guarda este mensaje como comprobante.`,
    cta: { label: "Ver barbería", href: shopUrl },
    footerNote: "Si no hiciste esta reserva, contacta a la barbería o ignora este correo.",
  });
}

export function bookingClientConfirmedEmailHtml(input: {
  clientName: string;
  shopName: string;
  shopSlug: string;
  serviceName: string;
  staffName: string;
  startAt: Date;
  timezone: string;
}) {
  const when = formatDateTime(input.startAt, input.timezone);
  const shopUrl = `${getAppUrl()}/${input.shopSlug}`;

  return renderEmailLayout({
    preheader: `Cita confirmada en ${input.shopName}`,
    eyebrow: "Cita confirmada",
    title: "¡Tu cita está confirmada!",
    introHtml: `Hola <strong style="color:#f5f5f5;">${escapeHtml(input.clientName)}</strong>, <strong style="color:#f5f5f5;">${escapeHtml(input.shopName)}</strong> confirmó tu reserva.`,
    details: [
      { label: "Servicio", value: escapeHtml(input.serviceName) },
      { label: "Barbero", value: escapeHtml(input.staffName) },
      { label: "Fecha y hora", value: escapeHtml(when) },
    ],
    noticeHtml: `Te esperamos puntual. Si necesitas cancelar, avisa a la barbería con anticipación.`,
    cta: { label: "Ver barbería", href: shopUrl },
  });
}
