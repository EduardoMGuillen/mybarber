import { createHmac, timingSafeEqual } from "node:crypto";

const SEP = ".";

function getSecret(): string | null {
  return process.env.AUTH_SECRET ?? null;
}

export function signAppointmentCancelToken(appointmentId: string): string | null {
  const secret = getSecret();
  if (!secret) return null;
  const sig = createHmac("sha256", secret)
    .update(`cancel:${appointmentId}`)
    .digest("hex")
    .slice(0, 24);
  return `${appointmentId}${SEP}${sig}`;
}

export function verifyAppointmentCancelToken(token: string): string | null {
  const secret = getSecret();
  if (!secret) return null;

  const idx = token.lastIndexOf(SEP);
  if (idx <= 0) return null;

  const appointmentId = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  if (!/^[0-9a-f-]{36}$/i.test(appointmentId)) return null;

  const expected = createHmac("sha256", secret)
    .update(`cancel:${appointmentId}`)
    .digest("hex")
    .slice(0, 24);

  try {
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return appointmentId;
  } catch {
    return null;
  }
}

export function buildAppointmentCancelUrl(
  shopSlug: string,
  appointmentId: string,
): string | null {
  const token = signAppointmentCancelToken(appointmentId);
  if (!token) return null;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://mibarberia.xyz";
  return `${appUrl}/${shopSlug}/reservar/cancelar?t=${encodeURIComponent(token)}`;
}
