"use server";

import { createHash, randomBytes } from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { parsePassword } from "@/lib/auth/password-policy";
import { hashPassword } from "@/lib/auth/passwords";
import { requireDb } from "@/lib/db";
import { passwordResetTokens, users } from "@/lib/db/schema";
import { sendEmail } from "@/lib/resend/client";
import { createRateLimiter, enforceRateLimit } from "@/lib/ratelimit";

const resetLimiter = createRateLimiter(5, "1 m");

const TOKEN_BYTES = 32;
const EXPIRY_HOURS = 2;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function requestPasswordReset(email: string) {
  await enforceRateLimit(resetLimiter, "password-reset");
  const normalized = email.trim().toLowerCase();
  if (!normalized) return { ok: true };

  const db = requireDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalized))
    .limit(1);

  if (!user) return { ok: true };

  if (!user.passwordHash) {
    return { ok: true, googleOnly: true };
  }

  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(passwordResetTokens.userId, user.id),
        isNull(passwordResetTokens.usedAt),
      ),
    );

  const token = randomBytes(TOKEN_BYTES).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + EXPIRY_HOURS);

  await db.insert(passwordResetTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const link = `${appUrl}/restablecer-contrasena/${token}`;

  try {
    await sendEmail({
      to: normalized,
      subject: "Restablecer contraseña — MiBarbería",
      html: `
      <div style="font-family:sans-serif;background:#0a0a0a;color:#f5f5f5;padding:24px">
        <h1 style="color:#c9a227">Restablecer contraseña</h1>
        <p>Hola${user.name ? ` ${user.name}` : ""},</p>
        <p>Recibimos una solicitud para restablecer tu contraseña. El enlace expira en ${EXPIRY_HOURS} horas.</p>
        <p><a href="${link}" style="color:#c9a227;font-weight:bold">Restablecer contraseña</a></p>
        <p style="word-break:break-all;font-size:12px;color:#a3a3a3">${link}</p>
        <p style="color:#a3a3a3;font-size:12px">Si no solicitaste esto, ignora este correo.</p>
      </div>
    `,
    });
  } catch {
    throw new Error(
      "No pudimos enviar el correo. Revisa la configuración de correo o inténtalo más tarde.",
    );
  }

  return { ok: true };
}

export async function confirmPasswordReset(token: string, password: string) {
  parsePassword(password);

  const tokenHash = hashToken(token);
  const db = requireDb();

  const [row] = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        gt(passwordResetTokens.expiresAt, new Date()),
        isNull(passwordResetTokens.usedAt),
      ),
    )
    .limit(1);

  if (!row) throw new Error("Enlace inválido o expirado");

  const passwordHash = await hashPassword(password);

  await db
    .update(users)
    .set({ passwordHash })
    .where(eq(users.id, row.userId));

  await db
    .update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, row.id));

  return { ok: true };
}
