import { APP_NAME, DEFAULT_APP_URL, SITE_HOST, SUPPORT_EMAIL } from "@/lib/constants";

const BRAND = {
  black: "#0a0a0a",
  surface: "#141414",
  gold: "#c9a227",
  goldLight: "#e8c547",
  text: "#f5f5f5",
  muted: "#a3a3a3",
  border: "rgba(255,255,255,0.12)",
} as const;

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_APP_URL;
}

export function formatDateTime(
  date: Date,
  timezone: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  return date.toLocaleString("es-HN", {
    timeZone: timezone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  });
}

type DetailRow = { label: string; value: string; html?: boolean };

type EmailLayoutOptions = {
  preheader?: string;
  eyebrow?: string;
  title: string;
  introHtml?: string;
  details?: DetailRow[];
  bodyHtml?: string;
  noticeHtml?: string;
  cta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  footerNote?: string;
};

function renderDetails(rows: DetailRow[]): string {
  const items = rows
    .map((row) => {
      const valueCell = row.html ? row.value : escapeHtml(row.value);
      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};color:${BRAND.muted};font-size:13px;width:38%;vertical-align:top;">
            ${escapeHtml(row.label)}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};color:${BRAND.text};font-size:14px;font-weight:600;vertical-align:top;">
            ${valueCell}
          </td>
        </tr>`;
    })
    .join("");

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:20px 0 8px;border-collapse:collapse;">
      ${items}
    </table>`;
}

function renderButton(label: string, href: string): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px auto 8px;">
      <tr>
        <td style="border-radius:10px;background:linear-gradient(135deg,${BRAND.gold} 0%,${BRAND.goldLight} 100%);">
          <a href="${escapeHtml(href)}" target="_blank" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:${BRAND.black};text-decoration:none;border-radius:10px;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>`;
}

/** Plantilla base compatible con clientes de correo (tablas + estilos inline). */
export function renderEmailLayout(options: EmailLayoutOptions): string {
  const appUrl = getAppUrl();
  const logoUrl = `${appUrl}/logotextpng.png`;
  const preheader = escapeHtml(options.preheader ?? options.title);

  const detailsBlock =
    options.details && options.details.length > 0
      ? renderDetails(options.details)
      : "";

  const ctaBlock = [
    options.cta ? renderButton(options.cta.label, options.cta.href) : "",
    options.secondaryCta
      ? `<p style="margin:12px 0 0;text-align:center;">
          <a href="${escapeHtml(options.secondaryCta.href)}" target="_blank" style="font-size:14px;color:${BRAND.muted};text-decoration:underline;">
            ${escapeHtml(options.secondaryCta.label)}
          </a>
        </p>`
      : "",
  ].join("");

  const noticeBlock = options.noticeHtml
    ? `<div style="margin-top:20px;padding:14px 16px;border-radius:10px;background:rgba(201,162,39,0.12);border:1px solid rgba(201,162,39,0.35);color:${BRAND.text};font-size:13px;line-height:1.55;">
        ${options.noticeHtml}
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <title>${escapeHtml(options.title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.black};font-family:'Segoe UI',system-ui,-apple-system,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${preheader}
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:${BRAND.black};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;border-collapse:collapse;">
          <tr>
            <td style="padding:0 0 24px;text-align:center;">
              <a href="${escapeHtml(appUrl)}" target="_blank" style="text-decoration:none;">
                <img src="${escapeHtml(logoUrl)}" alt="${escapeHtml(APP_NAME)}" width="56" height="56" style="display:block;margin:0 auto 12px;border:0;" />
              </a>
              <div style="font-size:20px;font-weight:800;color:${BRAND.gold};letter-spacing:-0.02em;">
                ${escapeHtml(APP_NAME)}
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color:${BRAND.surface};border:1px solid ${BRAND.border};border-radius:16px;padding:32px 28px;">
              ${
                options.eyebrow
                  ? `<p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${BRAND.gold};">
                      ${escapeHtml(options.eyebrow)}
                    </p>`
                  : ""
              }
              <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;font-weight:800;color:${BRAND.text};">
                ${escapeHtml(options.title)}
              </h1>
              ${
                options.introHtml
                  ? `<div style="margin:0 0 8px;font-size:15px;line-height:1.6;color:${BRAND.muted};">
                      ${options.introHtml}
                    </div>`
                  : ""
              }
              ${detailsBlock}
              ${
                options.bodyHtml
                  ? `<div style="margin:16px 0 0;font-size:14px;line-height:1.6;color:${BRAND.muted};">
                      ${options.bodyHtml}
                    </div>`
                  : ""
              }
              ${noticeBlock}
              ${ctaBlock}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 8px 0;text-align:center;font-size:12px;line-height:1.6;color:${BRAND.muted};">
              <p style="margin:0 0 8px;">
                ${escapeHtml(options.footerNote ?? `Este correo fue enviado por ${APP_NAME}.`)}
              </p>
              <p style="margin:0;">
                <a href="${escapeHtml(appUrl)}" style="color:${BRAND.gold};text-decoration:none;">${escapeHtml(SITE_HOST)}</a>
                ·
                <a href="mailto:${escapeHtml(SUPPORT_EMAIL)}" style="color:${BRAND.gold};text-decoration:none;">${escapeHtml(SUPPORT_EMAIL)}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
