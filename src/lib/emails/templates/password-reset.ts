import { escapeHtml, renderEmailLayout } from "@/lib/emails/layout";

export function passwordResetEmailHtml(input: {
  userName?: string | null;
  link: string;
  expiryHours: number;
  isNewPassword: boolean;
}) {
  const cta = input.isNewPassword ? "Crear contraseña" : "Restablecer contraseña";
  const title = input.isNewPassword ? "Crea tu contraseña" : "Restablece tu contraseña";
  const intro = input.isNewPassword
    ? "Recibimos una solicitud para crear una contraseña en tu cuenta (entras con Google u otro proveedor)."
    : "Recibimos una solicitud para restablecer la contraseña de tu cuenta.";

  const greeting = input.userName
    ? `Hola <strong style="color:#f5f5f5;">${escapeHtml(input.userName)}</strong>,`
    : "Hola,";

  return renderEmailLayout({
    preheader: `${cta} — enlace válido ${input.expiryHours} horas`,
    eyebrow: "Seguridad",
    title,
    introHtml: `${greeting}<br/><br/>${intro}`,
    noticeHtml: `El enlace expira en <strong style="color:#e8c547;">${input.expiryHours} horas</strong>. Si no solicitaste esto, puedes ignorar este correo; tu cuenta seguirá segura.`,
    bodyHtml: `Si el botón no funciona, copia y pega este enlace en tu navegador:<br/><br/><span style="word-break:break-all;font-size:12px;color:#a3a3a3;">${escapeHtml(input.link)}</span>`,
    cta: { label: cta, href: input.link },
    footerNote: "Nunca compartas este enlace con nadie.",
  });
}
