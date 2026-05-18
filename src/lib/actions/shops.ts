"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { hashPassword } from "@/lib/auth/passwords";
import { requireDb } from "@/lib/db";
import {
  businessHours,
  shopStaff,
  shops,
  userPreferences,
  users,
} from "@/lib/db/schema";
import { applyBusinessHours } from "@/lib/actions/business-hours";
import { calculateProfileCompleteness } from "@/lib/profile/completeness";
import {
  createDefaultBusinessHours,
  parseBusinessHoursInput,
} from "@/lib/shops/business-hours";
import { DEFAULT_BUSINESS_HOURS, getTrialEndsAt } from "@/lib/shops/defaults";
import { slugify, validateSlug } from "@/lib/slug";
import { DEFAULT_TIMEZONE } from "@/lib/constants";

const shopFieldsSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  slug: z.string().min(3, "El enlace debe tener al menos 3 caracteres"),
  description: z
    .string()
    .min(80, "La descripción debe tener al menos 80 caracteres (SEO)")
    .max(500, "Máximo 500 caracteres"),
  phone: z.string().min(8, "Teléfono inválido"),
  whatsappNumber: z.string().min(8, "WhatsApp inválido"),
  addressLine1: z.string().min(3, "Dirección requerida"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "Ciudad requerida"),
  state: z.string().min(2, "Departamento requerido"),
  country: z.string().default("HN"),
  postalCode: z.string().optional(),
  formattedAddress: z.string().min(3, "Confirma la ubicación en el mapa"),
  googlePlaceId: z.string().optional(),
  lat: z.string().min(1, "Localiza la dirección en el mapa"),
  lng: z.string().min(1, "Localiza la dirección en el mapa"),
  timezone: z.string().default(DEFAULT_TIMEZONE),
  instagramUrl: z
    .string()
    .url("Instagram: usa una URL válida (https://…)")
    .optional()
    .or(z.literal("")),
  logoUrl: z
    .string()
    .url("Logo: URL inválida")
    .optional()
    .or(z.literal("")),
  ownerName: z
    .string()
    .min(2, "Nombre del dueño: mínimo 2 caracteres")
    .optional(),
  ownerEmail: z.string().email("Correo del dueño inválido").optional(),
  ownerPassword: z
    .string()
    .min(8, "Contraseña del dueño: mínimo 8 caracteres")
    .optional(),
  billingExempt: z.boolean().optional(),
  status: z.enum(["trial", "active"]).optional(),
});

export type ShopMutationResult =
  | { ok: true; shopId: string; slug: string }
  | { ok: false; error: string };

const OPTIONAL_STRING_KEYS = [
  "ownerName",
  "ownerEmail",
  "ownerPassword",
  "addressLine2",
  "postalCode",
  "googlePlaceId",
] as const;

function blankToUndefined(value: unknown): unknown {
  if (typeof value === "string" && !value.trim()) return undefined;
  return value;
}

const SHOP_FIELD_LABELS: Record<string, string> = {
  name: "Nombre de la barbería",
  slug: "Enlace público",
  description: "Descripción",
  phone: "Teléfono",
  whatsappNumber: "WhatsApp",
  addressLine1: "Dirección",
  city: "Ciudad",
  state: "Departamento",
  formattedAddress: "Ubicación",
  lat: "Ubicación en el mapa",
  lng: "Ubicación en el mapa",
  instagramUrl: "Instagram",
  logoUrl: "Logo",
  ownerName: "Nombre del dueño",
  ownerEmail: "Correo del dueño",
  ownerPassword: "Contraseña del dueño",
};

function normalizeShopInput(input: Record<string, unknown>) {
  const instagram = input.instagramUrl;
  const logo = input.logoUrl;

  let instagramUrl = "";
  if (typeof instagram === "string" && instagram.trim()) {
    const trimmed = instagram.trim();
    instagramUrl =
      trimmed.startsWith("http://") || trimmed.startsWith("https://")
        ? trimmed
        : `https://${trimmed}`;
  }

  const normalized: Record<string, unknown> = {
    ...input,
    instagramUrl,
    logoUrl: typeof logo === "string" ? logo.trim() : "",
  };

  for (const key of OPTIONAL_STRING_KEYS) {
    normalized[key] = blankToUndefined(normalized[key]);
  }

  return normalized;
}

function parseShopFields(
  input: unknown,
):
  | { ok: true; data: z.infer<typeof shopFieldsSchema> }
  | { ok: false; error: string } {
  const normalized = normalizeShopInput(
    typeof input === "object" && input !== null
      ? (input as Record<string, unknown>)
      : {},
  );
  const parsed = shopFieldsSchema.safeParse(normalized);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const fieldKey = issue?.path[0];
    const field =
      typeof fieldKey === "string" ? SHOP_FIELD_LABELS[fieldKey] : undefined;
    const message = issue?.message ?? "Revisa los datos del formulario";
    const isGenericZod =
      message.startsWith("Too small") || message.startsWith("Too big");

    return {
      ok: false,
      error:
        field && isGenericZod
          ? `${field}: valor demasiado corto o incompleto`
          : field
            ? `${field}: ${message}`
            : message,
    };
  }
  const slugError = validateSlug(parsed.data.slug);
  if (slugError) return { ok: false, error: slugError };
  return { ok: true, data: parsed.data };
}

export async function createShopAsSuperadmin(
  input: z.infer<typeof shopFieldsSchema>,
) {
  const session = await auth();
  if (session?.user?.role !== "superadmin") throw new Error("No autorizado");

  const data = shopFieldsSchema.parse(input);
  const slugError = validateSlug(data.slug);
  if (slugError) throw new Error(slugError);

  if (!data.ownerEmail) throw new Error("Email del dueño requerido");

  const db = requireDb();
  const email = data.ownerEmail.toLowerCase();

  let ownerId: string;
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    ownerId = existingUser.id;
  } else {
    const passwordHash = data.ownerPassword
      ? await hashPassword(data.ownerPassword)
      : null;
    const [created] = await db
      .insert(users)
      .values({
        email,
        name: data.ownerName ?? data.name,
        role: "owner",
        passwordHash,
        emailVerified: new Date(),
      })
      .returning();
    if (!created) throw new Error("No se pudo crear el usuario");
    ownerId = created.id;
    await db.insert(userPreferences).values({ userId: ownerId });
  }

  const trialEndsAt = getTrialEndsAt();
  const completeness = calculateProfileCompleteness({
    ...data,
    lat: data.lat,
    lng: data.lng,
  } as never);

  const [shop] = await db
    .insert(shops)
    .values({
      slug: data.slug.toLowerCase(),
      name: data.name,
      ownerUserId: ownerId,
      status: data.status ?? (data.billingExempt ? "active" : "trial"),
      trialEndsAt,
      createdBy: "superadmin",
      phone: data.phone,
      whatsappNumber: data.whatsappNumber,
      description: data.description,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2 || null,
      city: data.city,
      state: data.state,
      country: data.country,
      postalCode: data.postalCode || null,
      formattedAddress: data.formattedAddress,
      googlePlaceId: data.googlePlaceId || null,
      lat: data.lat,
      lng: data.lng,
      timezone: data.timezone,
      instagramUrl: data.instagramUrl || null,
      logoUrl: data.logoUrl || null,
      billingExempt: data.billingExempt ?? false,
      profileCompleteness: completeness,
      onboardingCompletedAt: completeness >= 80 ? new Date() : null,
    })
    .returning();

  if (!shop) throw new Error("No se pudo crear la barbería");

  await db.insert(businessHours).values(
    DEFAULT_BUSINESS_HOURS.map((h) => ({ ...h, shopId: shop.id })),
  );

  await db.insert(shopStaff).values({
    shopId: shop.id,
    userId: ownerId,
    displayName: data.ownerName ?? data.name,
    sortOrder: 0,
  });

  revalidatePath("/admin");
  revalidatePath(`/${shop.slug}`);
  return { shopId: shop.id, slug: shop.slug };
}

export async function updateShopStatus(
  shopId: string,
  status: "active" | "suspended" | "trial",
  extra?: { trialEndsAt?: Date; billingExempt?: boolean },
) {
  const session = await auth();
  if (session?.user?.role !== "superadmin") throw new Error("No autorizado");

  const db = requireDb();
  const [shop] = await db
    .update(shops)
    .set({
      status,
      ...(extra?.trialEndsAt ? { trialEndsAt: extra.trialEndsAt } : {}),
      ...(extra?.billingExempt !== undefined
        ? { billingExempt: extra.billingExempt }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(shops.id, shopId))
    .returning();

  if (shop) {
    revalidatePath("/admin");
    revalidatePath(`/${shop.slug}`);
  }
  return shop;
}

export async function completeOnboarding(
  input: unknown,
  hoursInput?: unknown,
): Promise<ShopMutationResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "No autenticado" };
  }

  const parsed = parseShopFields(input);
  if (!parsed.ok) return parsed;

  const hoursParsed = parseBusinessHoursInput(
    hoursInput ?? createDefaultBusinessHours(),
  );
  if (!hoursParsed.ok) return hoursParsed;

  const data = parsed.data;

  try {
    const db = requireDb();
    const [existingSlug] = await db
      .select()
      .from(shops)
      .where(eq(shops.slug, data.slug.toLowerCase()))
      .limit(1);

    const ownerShop = await db
      .select()
      .from(shops)
      .where(eq(shops.ownerUserId, session.user.id))
      .limit(1);

    if (existingSlug && existingSlug.ownerUserId !== session.user.id) {
      return { ok: false, error: "Este enlace ya está en uso" };
    }

    const trialEndsAt = getTrialEndsAt();
    const completeness = calculateProfileCompleteness({
      ...data,
      lat: data.lat,
      lng: data.lng,
    } as never);

    const shopValues = {
      slug: data.slug.toLowerCase(),
      name: data.name,
      phone: data.phone,
      whatsappNumber: data.whatsappNumber,
      description: data.description,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2 || null,
      city: data.city,
      state: data.state,
      country: data.country,
      postalCode: data.postalCode || null,
      formattedAddress: data.formattedAddress,
      googlePlaceId: data.googlePlaceId || null,
      lat: data.lat,
      lng: data.lng,
      timezone: data.timezone,
      instagramUrl: data.instagramUrl || null,
      logoUrl: data.logoUrl || null,
      profileCompleteness: completeness,
      onboardingCompletedAt: completeness >= 80 ? new Date() : null,
      updatedAt: new Date(),
    };

    let shopId: string;

    if (ownerShop[0]) {
      const [updated] = await db
        .update(shops)
        .set(shopValues)
        .where(eq(shops.id, ownerShop[0].id))
        .returning();
      if (!updated) {
        return { ok: false, error: "No se pudo actualizar la barbería" };
      }
      shopId = updated.id;
    } else {
      const [created] = await db
        .insert(shops)
        .values({
          ...shopValues,
          ownerUserId: session.user.id,
          status: "trial",
          trialEndsAt,
          createdBy: "self",
        })
        .returning();
      if (!created) {
        return { ok: false, error: "No se pudo crear la barbería" };
      }
      shopId = created.id;

      await db.insert(shopStaff).values({
        shopId,
        userId: session.user.id,
        displayName: session.user.name ?? data.name,
        sortOrder: 0,
      });
    }

    await applyBusinessHours(shopId, hoursParsed.data, true);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/configuracion/perfil");
    revalidatePath("/dashboard/configuracion/horario");
    revalidatePath(`/${data.slug}`);
    return { ok: true, shopId, slug: data.slug };
  } catch (err) {
    console.error("[completeOnboarding]", err);
    const message = err instanceof Error ? err.message.toLowerCase() : "";
    if (message.includes("unique") || message.includes("duplicate")) {
      return { ok: false, error: "Este enlace ya está en uso" };
    }
    return {
      ok: false,
      error: "No se pudo guardar la barbería. Inténtalo de nuevo.",
    };
  }
}

export async function updateShopProfile(
  input: unknown,
): Promise<ShopMutationResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "No autenticado" };
  }
  if (session.user.role !== "owner") {
    return { ok: false, error: "Solo el dueño puede editar el perfil" };
  }

  const parsed = parseShopFields(input);
  if (!parsed.ok) return parsed;

  const data = parsed.data;

  try {
    const db = requireDb();
    const [ownerShop] = await db
      .select()
      .from(shops)
      .where(eq(shops.ownerUserId, session.user.id))
      .limit(1);

    if (!ownerShop) {
      return { ok: false, error: "Sin barbería" };
    }

    const [existingSlug] = await db
      .select()
      .from(shops)
      .where(eq(shops.slug, data.slug.toLowerCase()))
      .limit(1);

    if (existingSlug && existingSlug.id !== ownerShop.id) {
      return { ok: false, error: "Este enlace ya está en uso" };
    }

    const completeness = calculateProfileCompleteness({
      ...data,
      lat: data.lat,
      lng: data.lng,
    } as never);

    const [updated] = await db
      .update(shops)
      .set({
        slug: data.slug.toLowerCase(),
        name: data.name,
        phone: data.phone,
        whatsappNumber: data.whatsappNumber,
        description: data.description,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || null,
        city: data.city,
        state: data.state,
        country: data.country,
        postalCode: data.postalCode || null,
        formattedAddress: data.formattedAddress,
        googlePlaceId: data.googlePlaceId || null,
        lat: data.lat,
        lng: data.lng,
        timezone: data.timezone,
        instagramUrl: data.instagramUrl || null,
        logoUrl: data.logoUrl || null,
        profileCompleteness: completeness,
        onboardingCompletedAt:
          completeness >= 80
            ? (ownerShop.onboardingCompletedAt ?? new Date())
            : null,
        updatedAt: new Date(),
      })
      .where(eq(shops.id, ownerShop.id))
      .returning();

    if (!updated) {
      return { ok: false, error: "No se pudo guardar el perfil" };
    }

    revalidatePath("/dashboard/configuracion/perfil");
    revalidatePath(`/${updated.slug}`);
    return { ok: true, shopId: updated.id, slug: updated.slug };
  } catch (err) {
    console.error("[updateShopProfile]", err);
    const message = err instanceof Error ? err.message.toLowerCase() : "";
    if (message.includes("unique") || message.includes("duplicate")) {
      return { ok: false, error: "Este enlace ya está en uso" };
    }
    return { ok: false, error: "No se pudo guardar el perfil. Inténtalo de nuevo." };
  }
}

export { slugify };
