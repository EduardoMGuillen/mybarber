/** OpenStreetMap embed — no API key required. */
export function buildOsmEmbedUrl(lat: string, lng: string): string {
  const la = Number(lat);
  const lo = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(lo)) return "";

  const pad = 0.012;
  const bbox = `${lo - pad},${la - pad},${lo + pad},${la + pad}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${la}%2C${lo}`;
}

export function buildDirectionsUrl(lat: string, lng: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${lat},${lng}`)}`;
}
