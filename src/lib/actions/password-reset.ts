"use server";

import { createHash, randomBytes } from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { parsePassword } from "@/lib/auth/password-policy";
import { hashPassword } from "@/lib/auth/passwords";
import { requireDb } from "@/lib/db";
import { passwordResetTokens, users } from "@/lib/db/schema";
import { passwordResetEmailHtml } from "@/lib/emails/templates/password-reset";
import { sendEmail } from "@/lib/resend/client";
import { createRateLimiter, enforceRateLimit } from "@/lib/ratelimit";

const resetLimiter = createRateLimiter(5, "1 m");

const TOKEN_BYTES = 32;
const EXPIRY_HOURS = 2;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export type PasswordResetRequestResult =
  | { status: "success" }
  | { status: "rate_limited"; message: string }
  | { status: "delivery_failed" };

export async function requestPasswordReset(
  email: string,
): Promise<PasswordResetRequestResult> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return { status: "success" };

  const rateKey = createHash("sha256")
    .update(`password-reset:${normalized}`)
    .digest("hex")
    .slice(0, 24);

  try {
    await enforceRateLimit(resetLimiter, rateKey);
  } catch (err) {
    if (
      err instanceof Error &&
      err.message.includes("Demasiados intentos")
    ) {
      return { status: "rate_limited", message: err.message };
    }
    throw err;
  }

  const db = requireDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalized))
    .limit(1);

  if (!user) return { status: "success" };

  const isNewPassword = !user.passwordHash;

  try {
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

    const subject = isNewPassword
      ? "Crear contraseña — MiBarbería"
      : "Restablecer contraseña — MiBarbería";

    await sendEmail({
      to: normalized,
      subject,
      html: passwordResetEmailHtml({
        userName: user.name,
        link,
        expiryHours: EXPIRY_HOURS,
        isNewPassword,
      }),
    });

    if (!process.env.RESEND_API_KEY) {
      console.log("[password-reset:dev] link for", normalized, link);
    }

    return { status: "success" };
  } catch (err) {
    console.error("[password-reset] failed for", normalized, err);
    return { status: "delivery_failed" };
  }
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
