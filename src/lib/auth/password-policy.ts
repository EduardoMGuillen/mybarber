import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .regex(/[A-Z]/, "Incluye al menos una mayúscula")
  .regex(/[0-9]/, "Incluye al menos un número");

export function parsePassword(password: string) {
  const result = passwordSchema.safeParse(password);
  if (!result.success) {
    throw new Error(result.error.issues[0]?.message ?? "Contraseña inválida");
  }
  return result.data;
}
