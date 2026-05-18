"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ShopFormData } from "@/components/shops/shop-form";

type Props = {
  form: ShopFormData;
  onUpdate: <K extends keyof ShopFormData>(key: K, value: ShopFormData[K]) => void;
};

export function LocationPicker({ form, onUpdate }: Props) {
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);
  const hasCoords = Boolean(form.lat && form.lng);

  async function locateOnMap() {
    const parts = [
      form.formattedAddress,
      form.city,
      form.state,
      form.country === "HN" ? "Honduras" : form.country,
    ].filter(Boolean);
    const query = parts.join(", ").trim() || form.formattedAddress.trim();

    if (query.length < 5) {
      setGeocodeError("Escribe la dirección y la ciudad antes de localizar.");
      return;
    }

    setGeocoding(true);
    setGeocodeError(null);
    try {
      const res = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = (await res.json()) as {
        error?: string;
        lat?: string;
        lng?: string;
        formattedAddress?: string;
        addressLine1?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
      };

      if (!res.ok) {
        setGeocodeError(data.error ?? "No se pudo localizar la dirección.");
        return;
      }

      if (data.lat) onUpdate("lat", data.lat);
      if (data.lng) onUpdate("lng", data.lng);
      if (data.formattedAddress) onUpdate("formattedAddress", data.formattedAddress);
      if (data.addressLine1) onUpdate("addressLine1", data.addressLine1);
      if (data.city) onUpdate("city", data.city);
      if (data.state) onUpdate("state", data.state);
      if (data.country) onUpdate("country", data.country);
      if (data.postalCode) onUpdate("postalCode", data.postalCode);
    } catch {
      setGeocodeError("Error de conexión. Intenta de nuevo.");
    } finally {
      setGeocoding(false);
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-brand-gold">Ubicación</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="formattedAddress">Dirección completa</Label>
          <Input
            id="formattedAddress"
            value={form.formattedAddress}
            onChange={(e) => {
              onUpdate("formattedAddress", e.target.value);
              if (!form.addressLine1) onUpdate("addressLine1", e.target.value);
            }}
            required
            placeholder="Ej. Col. Palmira, Blvd. Morazán, Tegucigalpa"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">Ciudad</Label>
          <Input
            id="city"
            value={form.city}
            onChange={(e) => onUpdate("city", e.target.value)}
            required
            placeholder="Tegucigalpa"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">Departamento</Label>
          <Input
            id="state"
            value={form.state}
            onChange={(e) => onUpdate("state", e.target.value)}
            required
            placeholder="Ej. Francisco Morazán"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={geocoding}
          onClick={locateOnMap}
        >
          {geocoding ? "Buscando…" : "Localizar en mapa"}
        </Button>
        {hasCoords && (
          <span className="text-xs text-emerald-400">
            Ubicación confirmada ({Number(form.lat).toFixed(4)},{" "}
            {Number(form.lng).toFixed(4)})
          </span>
        )}
      </div>

      {geocodeError && <p className="text-sm text-red-400">{geocodeError}</p>}

      <p className="text-xs text-brand-text-muted">
        Usamos OpenStreetMap (gratis, sin API key). Escribe la dirección, pulsa
        localizar y revisa que el punto sea correcto.
      </p>

      {!hasCoords && (
        <p className="text-xs text-amber-400/90">
          Debes localizar la dirección en el mapa antes de guardar.
        </p>
      )}
    </section>
  );
}
