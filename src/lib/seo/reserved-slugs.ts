export const RESERVED_SLUGS = new Set([
  "admin",
  "dashboard",
  "api",
  "login",
  "registro",
  "onboarding",
  "olvide-contrasena",
  "restablecer-contrasena",
  "invitacion",
  "precios",
  "legal",
  "terminos",
  "privacidad",
  "no-disponible",
  "reservar",
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}
