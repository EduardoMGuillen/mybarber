import { isReservedSlug } from "@/lib/seo/reserved-slugs";

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function validateSlug(slug: string): string | null {
  if (!slug || slug.length < 3) return "Mínimo 3 caracteres";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return "Solo letras minúsculas, números y guiones";
  }
  if (isReservedSlug(slug)) return "Este enlace no está disponible";
  return null;
}
