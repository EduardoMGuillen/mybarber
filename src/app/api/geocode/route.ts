import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { geocodeWithNominatim } from "@/lib/geocoding/nominatim";
import { createRateLimiter, enforceRateLimit } from "@/lib/ratelimit";

const geocodeLimiter = createRateLimiter(20, "1 m");

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  let body: { query?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  await enforceRateLimit(geocodeLimiter, `geocode:${session.user.id}`);

  const query = body.query?.trim() ?? "";
  if (query.length < 5 || query.length > 300) {
    return NextResponse.json(
      { error: "Escribe una dirección más completa (mín. 5 caracteres)." },
      { status: 400 },
    );
  }

  try {
    const result = await geocodeWithNominatim(query);
    if (!result) {
      return NextResponse.json(
        { error: "No encontramos esa dirección. Prueba con ciudad y país (ej. Tegucigalpa, Honduras)." },
        { status: 404 },
      );
    }
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al buscar la dirección";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
