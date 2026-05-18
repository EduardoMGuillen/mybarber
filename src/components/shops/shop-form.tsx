"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { slugify } from "@/lib/slug";
import { LocationPicker } from "@/components/shops/location-picker";
import { ImageUpload } from "@/components/ui/image-upload";

export type ShopFormData = {
  name: string;
  slug: string;
  description: string;
  phone: string;
  whatsappNumber: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  formattedAddress: string;
  googlePlaceId?: string;
  lat: string;
  lng: string;
  timezone: string;
  instagramUrl?: string;
  logoUrl?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPassword?: string;
  billingExempt?: boolean;
  status?: "trial" | "active";
};

type Props = {
  initial?: Partial<ShopFormData>;
  showOwnerFields?: boolean;
  showAdminOptions?: boolean;
  onSubmit: (data: ShopFormData) => Promise<void>;
  submitLabel?: string;
};

export function ShopForm({
  initial,
  showOwnerFields,
  showAdminOptions,
  onSubmit,
  submitLabel = "Guardar",
}: Props) {
  const [form, setForm] = useState<ShopFormData>({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    phone: initial?.phone ?? "",
    whatsappNumber: initial?.whatsappNumber ?? "",
    addressLine1: initial?.addressLine1 ?? "",
    addressLine2: initial?.addressLine2 ?? "",
    city: initial?.city ?? "",
    state: initial?.state ?? "Francisco Morazán",
    country: initial?.country ?? "HN",
    postalCode: initial?.postalCode ?? "",
    formattedAddress: initial?.formattedAddress ?? "",
    googlePlaceId: initial?.googlePlaceId ?? "",
    lat: initial?.lat ?? "",
    lng: initial?.lng ?? "",
    timezone: initial?.timezone ?? "America/Tegucigalpa",
    instagramUrl: initial?.instagramUrl ?? "",
    logoUrl: initial?.logoUrl ?? "",
    ownerName: initial?.ownerName ?? "",
    ownerEmail: initial?.ownerEmail ?? "",
    ownerPassword: initial?.ownerPassword ?? "",
    billingExempt: initial?.billingExempt ?? false,
    status: initial?.status ?? "trial",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof ShopFormData>(key: K, value: ShopFormData[K]) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "name" && !initial?.slug) {
        next.slug = slugify(String(value));
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.lat?.trim() || !form.lng?.trim()) {
      setError("Localiza la dirección en el mapa antes de guardar.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-brand-gold">Negocio</h2>
        <ImageUpload
          label="Logo de la barbería"
          kind="logo"
          value={form.logoUrl}
          onChange={(url) => update("logoUrl", url)}
          hint="JPG o PNG, máx. 2 MB. Aparece en tu landing y SEO."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Nombre de la barbería</Label>
            <Input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Enlace público</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-brand-text-muted">mibarberia.dev/</span>
              <Input id="slug" value={form.slug} onChange={(e) => update("slug", e.target.value.toLowerCase())} required />
            </div>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Descripción (mín. 80 caracteres, para SEO)</Label>
            <textarea
              id="description"
              className="flex min-h-[100px] w-full rounded-lg border border-white/10 bg-brand-surface px-3 py-2 text-sm"
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              required
              minLength={80}
            />
          </div>
        </div>
      </section>

      <LocationPicker form={form} onUpdate={update} />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-brand-gold">Contacto</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input id="whatsapp" value={form.whatsappNumber} onChange={(e) => update("whatsappNumber", e.target.value)} required />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="instagram">Instagram (opcional)</Label>
            <Input id="instagram" value={form.instagramUrl} onChange={(e) => update("instagramUrl", e.target.value)} />
          </div>
        </div>
      </section>

      {showOwnerFields && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-brand-gold">Dueño</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ownerName">Nombre</Label>
              <Input id="ownerName" value={form.ownerName} onChange={(e) => update("ownerName", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerEmail">Email</Label>
              <Input id="ownerEmail" type="email" value={form.ownerEmail} onChange={(e) => update("ownerEmail", e.target.value)} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ownerPassword">Contraseña temporal</Label>
              <Input id="ownerPassword" type="password" value={form.ownerPassword} onChange={(e) => update("ownerPassword", e.target.value)} />
            </div>
          </div>
        </section>
      )}

      {showAdminOptions && (
        <section className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.billingExempt}
              onChange={(e) => update("billingExempt", e.target.checked)}
            />
            Exento de PayPal
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.status === "active"}
              onChange={(e) => update("status", e.target.checked ? "active" : "trial")}
            />
            Activar sin trial
          </label>
        </section>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full sm:w-auto">
        {loading ? "Guardando…" : submitLabel}
      </Button>
    </form>
  );
}
