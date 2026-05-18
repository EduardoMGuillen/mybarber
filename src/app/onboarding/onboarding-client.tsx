"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { BusinessHoursEditor } from "@/components/shops/business-hours-editor";
import { ShopForm } from "@/components/shops/shop-form";
import { createDefaultBusinessHours } from "@/lib/shops/business-hours";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addService } from "@/lib/actions/services";
import { completeOnboarding } from "@/lib/actions/shops";

export function OnboardingClient() {
  const router = useRouter();
  const [serviceName, setServiceName] = useState("Corte clásico");
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [priceDisplay, setPriceDisplay] = useState("");
  const [businessHours, setBusinessHours] = useState(createDefaultBusinessHours);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 space-y-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <BrandLogo size="md" href="/" />
        <div>
          <h1 className="text-2xl font-bold">Configura tu barbería</h1>
          <p className="mt-1 text-sm text-brand-text-muted">
            Datos públicos, ubicación y tu primer servicio.
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-white/10 bg-brand-surface p-6 space-y-4">
        <h2 className="text-lg font-semibold text-brand-gold">Servicio principal</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="serviceName">Nombre</Label>
            <Input
              id="serviceName"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">Duración (min)</Label>
            <Input
              id="duration"
              type="number"
              min={15}
              max={240}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2 sm:col-span-3">
            <Label htmlFor="price">Precio (texto, ej. L 200)</Label>
            <Input
              id="price"
              value={priceDisplay}
              onChange={(e) => setPriceDisplay(e.target.value)}
              placeholder="L 200"
            />
          </div>
        </div>
      </section>

      <BusinessHoursEditor value={businessHours} onChange={setBusinessHours} />

      <ShopForm
        submitLabel="Finalizar y abrir panel"
        onSubmit={async (data) => {
          const shopResult = await completeOnboarding(data, businessHours);
          if (!shopResult.ok) {
            throw new Error(shopResult.error);
          }

          const serviceResult = await addService(
            {
              name: serviceName,
              durationMinutes: Number(durationMinutes),
              priceDisplay: priceDisplay || undefined,
            },
            shopResult.shopId,
          );
          if (!serviceResult.ok) {
            throw new Error(serviceResult.error);
          }

          router.push("/dashboard");
          router.refresh();
        }}
      />
    </div>
  );
}

