"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/passwords";
import { requireDb } from "@/lib/db";
import { userPreferences, users } from "@/lib/db/schema";
import { createRateLimiter, enforceRateLimit } from "@/lib/ratelimit";

const registerLimiter = createRateLimiter(5, "1 m");

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Incluye una mayúscula")
    .regex(/[0-9]/, "Incluye un número"),
});

export async function registerOwner(input: z.infer<typeof schema>) {
  await enforceRateLimit(registerLimiter, "register");
  const data = schema.parse(input);
  const db = requireDb();
  const email = data.email.toLowerCase();

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) throw new Error("Este correo ya está registrado");

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

  if (!user) throw new Error("Error al registrar");

  await db.insert(userPreferences).values({ userId: user.id });

  return { ok: true };
}
