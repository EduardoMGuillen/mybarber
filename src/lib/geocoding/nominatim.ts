const NOMINATIM_SEARCH = "https://nominatim.openstreetmap.org/search";

export type GeocodeResult = {
  lat: string;
  lng: string;
  formattedAddress: string;
  addressLine1: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
};

type NominatimAddress = {
  road?: string;
  house_number?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  state?: string;
  country?: string;
  country_code?: string;
  postcode?: string;
};

type NominatimItem = {
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddress;
};

function line1FromAddress(addr: NominatimAddress): string {
  const street = [addr.house_number, addr.road].filter(Boolean).join(" ").trim();
  if (street) return street;
  return addr.suburb ?? "";
}

export async function geocodeWithNominatim(
  query: string,
): Promise<GeocodeResult | null> {
  const q = query.trim();
  if (q.length < 5) return null;

  const params = new URLSearchParams({
    q,
    format: "json",
    limit: "1",
    addressdetails: "1",
  });

  const res = await fetch(`${NOMINATIM_SEARCH}?${params}`, {
    headers: {
      "User-Agent":
        process.env.GEOCODE_USER_AGENT ??
        "MiBarberia/1.0 (contact: eduardomaldonadoguillen76@gmail.com)",
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("No se pudo buscar la dirección. Intenta de nuevo.");
  }

  const data = (await res.json()) as NominatimItem[];
  const hit = data[0];
  if (!hit) return null;

  const addr = hit.address ?? {};
  const city =
    addr.city ?? addr.town ?? addr.village ?? addr.municipality ?? "";
  const line1 =
    line1FromAddress(addr) || hit.display_name.split(",")[0] || "";

  return {
    lat: hit.lat,
    lng: hit.lon,
    formattedAddress: hit.display_name,
    addressLine1: line1,
    city,
    state: addr.state ?? "",
    country: (addr.country_code ?? "hn").toUpperCase(),
    postalCode: addr.postcode ?? "",
  };
}
