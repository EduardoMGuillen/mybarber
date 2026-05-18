"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addService, deleteService } from "@/lib/actions/services";

type Service = {
  id: string;
  name: string;
  durationMinutes: number;
  priceDisplay: string | null;
  active: boolean;
};

export function ServicesManager({ services }: { services: Service[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [duration, setDuration] = useState("30");
  const [price, setPrice] = useState("");

  function run(action: () => Promise<unknown>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error");
      }
    });
  }

  return (
    <div className="space-y-8">
      <form
        className="rounded-xl border border-white/10 bg-brand-surface p-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          run(async () => {
            await addService({
              name,
              durationMinutes: Number(duration),
              priceDisplay: price || undefined,
            });
            setName("");
            setPrice("");
          });
        }}
      >
        <h2 className="font-semibold text-brand-gold">Agregar servicio</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="svc-name">Nombre</Label>
            <Input
              id="svc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="svc-duration">Duración (min)</Label>
            <Input
              id="svc-duration"
              type="number"
              min={15}
              max={240}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2 sm:col-span-3">
            <Label htmlFor="svc-price">Precio (texto, opcional)</Label>
            <Input
              id="svc-price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="L 150"
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" disabled={pending}>
          Agregar
        </Button>
      </form>

      <ul className="space-y-2">
        {services
          .filter((s) => s.active)
          .map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-brand-surface px-4 py-3"
            >
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-sm text-brand-text-muted">
                  {s.durationMinutes} min
                  {s.priceDisplay ? ` · ${s.priceDisplay}` : ""}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() => run(() => deleteService(s.id))}
              >
                Desactivar
              </Button>
            </li>
          ))}
      </ul>
    </div>
  );
}
