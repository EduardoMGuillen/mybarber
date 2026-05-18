"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/passwords";
import { requireDb } from "@/lib/db";
import { userPreferences, users } from "@/lib/db/schema";
import { createRateLimiter, enforceRateLimit } from "@/lib/ratelimit";

const registerLimiter = createRateLimiter(5, "1 m");

const schema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Correo inválido"),
  password: z
    .string()
    .min(8, "Mínimo 8 caracteres")
    .regex(/[A-Z]/, "Incluye al menos una mayúscula")
    .regex(/[0-9]/, "Incluye al menos un número"),
});

export type RegisterOwnerResult =
  | { ok: true }
  | { ok: false; error: string };

export async function registerOwner(
  input: z.infer<typeof schema>,
): Promise<RegisterOwnerResult> {
  try {
    await enforceRateLimit(registerLimiter, "register");
  } catch (err) {
    if (
      err instanceof Error &&
      err.message.includes("Demasiados intentos")
    ) {
      return { ok: false, error: err.message };
    }
  }

  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  const data = parsed.data;

  try {
    const db = requireDb();
    const email = data.email.toLowerCase();

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return { ok: false, error: "Este correo ya está registrado" };
    }

    const passwordHash = await hashPassword(data.password);
    const [user] = await db
      .insert(users)
      .values({
        email,
        name: data.name,
        role: "owner",
        passwordHash,
        emailVerified: new Date(),
      })
      .returning();

    if (!user) {
      return { ok: false, error: "Error al registrar. Inténtalo de nuevo." };
    }

    await db.insert(userPreferences).values({ userId: user.id });

    return { ok: true };
  } catch (err) {
    const message =
      err instanceof Error ? err.message.toLowerCase() : "";

    if (message.includes("unique") || message.includes("duplicate")) {
      return { ok: false, error: "Este correo ya está registrado" };
    }

    console.error("[register]", err);
    return { ok: false, error: "Error al registrar. Inténtalo de nuevo." };
  }
}
