import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { requireDb } from "@/lib/db";
import { shopStaff, shops } from "@/lib/db/schema";
import { uploadPublicImage } from "@/lib/storage/blob";
import { getShopForUser } from "@/lib/tenant";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Formulario inválido" }, { status: 400 });
  }

  const file = formData.get("file");
  const kind = formData.get("kind");
  const staffMemberId = formData.get("staffMemberId");
  const shopIdParam = formData.get("shopId");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
  }

  if (kind !== "logo" && kind !== "staff") {
    return NextResponse.json({ error: "Tipo de subida inválido" }, { status: 400 });
  }

  const role = session.user.role ?? "owner";

  if (role !== "owner" && role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  try {
    const db = requireDb();
    let shop =
      role === "owner"
        ? await getShopForUser(session.user.id, "owner")
        : null;

    if (role === "superadmin" && typeof shopIdParam === "string" && shopIdParam) {
      const [byId] = await db
        .select()
        .from(shops)
        .where(eq(shops.id, shopIdParam))
        .limit(1);
      shop = byId ?? null;
    }

    if (kind === "logo") {
      const path = shop
        ? `shops/${shop.id}/logo`
        : `drafts/${session.user.id}/logo`;
      const url = await uploadPublicImage(file, path);
      return NextResponse.json({ url });
    }

    if (!shop) {
      return NextResponse.json(
        { error: "Crea tu barbería antes de subir fotos del equipo." },
        { status: 400 },
      );
    }

    if (typeof staffMemberId !== "string" || !staffMemberId) {
      return NextResponse.json(
        { error: "Guarda el barbero antes de subir su foto." },
        { status: 400 },
      );
    }

    const [staffRow] = await db
      .select({ shopId: shopStaff.shopId })
      .from(shopStaff)
      .where(eq(shopStaff.id, staffMemberId))
      .limit(1);

    if (!staffRow || staffRow.shopId !== shop.id) {
      return NextResponse.json({ error: "Barbero no encontrado" }, { status: 404 });
    }

    const url = await uploadPublicImage(
      file,
      `shops/${shop.id}/staff/${staffMemberId}`,
    );
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al subir";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
