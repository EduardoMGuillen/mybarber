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
import { calculateProfileCompleteness } from "@/lib/profile/completeness";
import { DEFAULT_BUSINESS_HOURS, getTrialEndsAt } from "@/lib/shops/defaults";
import { slugify, validateSlug } from "@/lib/slug";
import { DEFAULT_TIMEZONE } from "@/lib/constants";

const shopFieldsSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(3),
  description: z.string().min(80).max(500),
  phone: z.string().min(8),
  whatsappNumber: z.string().min(8),
  addressLine1: z.string().min(3),
  addressLine2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  country: z.string().default("HN"),
  postalCode: z.string().optional(),
  formattedAddress: z.string().min(3),
  googlePlaceId: z.string().optional(),
  lat: z.string(),
  lng: z.string(),
  timezone: z.string().default(DEFAULT_TIMEZONE),
  instagramUrl: z.string().url().optional().or(z.literal("")),
  ownerName: z.string().min(2).optional(),
  ownerEmail: z.string().email().optional(),
  ownerPassword: z.string().min(8).optional(),
  billingExempt: z.boolean().optional(),
  status: z.enum(["trial", "active"]).optional(),
});

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
  input: z.infer<typeof shopFieldsSchema>,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");

  const data = shopFieldsSchema.parse(input);
  const slugError = validateSlug(data.slug);
  if (slugError) throw new Error(slugError);

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
    throw new Error("Este enlace ya está en uso");
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
    shopId = updated!.id;
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
    shopId = created!.id;

    await db.insert(businessHours).values(
      DEFAULT_BUSINESS_HOURS.map((h) => ({ ...h, shopId })),
    );

    await db.insert(shopStaff).values({
      shopId,
      userId: session.user.id,
      displayName: session.user.name ?? data.name,
      sortOrder: 0,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath(`/${data.slug}`);
  return { shopId, slug: data.slug };
}

export async function updateShopProfile(
  input: z.infer<typeof shopFieldsSchema>,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("No autenticado");
  if (session.user.role !== "owner") throw new Error("Solo el dueño puede editar el perfil");

  const data = shopFieldsSchema.parse(input);
  const slugError = validateSlug(data.slug);
  if (slugError) throw new Error(slugError);

  const db = requireDb();
  const [ownerShop] = await db
    .select()
    .from(shops)
    .where(eq(shops.ownerUserId, session.user.id))
    .limit(1);

  if (!ownerShop) throw new Error("Sin barbería");

  const [existingSlug] = await db
    .select()
    .from(shops)
    .where(eq(shops.slug, data.slug.toLowerCase()))
    .limit(1);

  if (existingSlug && existingSlug.id !== ownerShop.id) {
    throw new Error("Este enlace ya está en uso");
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
      profileCompleteness: completeness,
      onboardingCompletedAt:
        completeness >= 80 ? ownerShop.onboardingCompletedAt ?? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(shops.id, ownerShop.id))
    .returning();

  revalidatePath("/dashboard/configuracion/perfil");
  revalidatePath(`/${updated!.slug}`);
  return { slug: updated!.slug };
}

export { slugify };
