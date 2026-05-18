import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { requireDb } from "@/lib/db";
import { shopStaff } from "@/lib/db/schema";
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

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });
  }

  if (kind !== "logo" && kind !== "staff") {
    return NextResponse.json({ error: "Tipo de subida inválido" }, { status: 400 });
  }

  try {
    if (session.user.role === "superadmin" && kind === "logo") {
      const shopId = formData.get("shopId");
      if (typeof shopId !== "string") {
        return NextResponse.json({ error: "shopId requerido" }, { status: 400 });
      }
      const url = await uploadPublicImage(file, `shops/${shopId}/logo`);
      return NextResponse.json({ url });
    }

    if (session.user.role !== "owner") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const shop = await getShopForUser(session.user.id, "owner");
    if (!shop) {
      return NextResponse.json({ error: "Sin barbería" }, { status: 400 });
    }

    if (kind === "logo") {
      const url = await uploadPublicImage(file, `shops/${shop.id}/logo`);
      return NextResponse.json({ url });
    }

    if (typeof staffMemberId !== "string") {
      return NextResponse.json({ error: "staffMemberId requerido" }, { status: 400 });
    }

    const db = requireDb();
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
