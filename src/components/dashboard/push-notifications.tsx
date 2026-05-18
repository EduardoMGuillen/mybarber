"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function PushNotifications({
  initialEnabled,
  vapidPublicKey,
}: {
  initialEnabled: boolean;
  vapidPublicKey?: string;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        !!vapidPublicKey,
    );
  }, [vapidPublicKey]);

  async function enable() {
    if (!vapidPublicKey) {
      setError("VAPID no configurado en el servidor.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("Permiso de notificaciones denegado.");
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? "No se pudo activar push");
      }
      setEnabled(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al activar");
    } finally {
      setLoading(false);
    }
  }

  async function disable() {
    setLoading(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      await sub?.unsubscribe();
      await fetch("/api/push/subscribe", { method: "DELETE" });
      setEnabled(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al desactivar");
    } finally {
      setLoading(false);
    }
  }

  if (!supported) {
    return (
      <p className="text-sm text-brand-text-muted">
        Notificaciones push no disponibles (configura VAPID y usa HTTPS).
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-white/10 p-4">
      <Label>Notificaciones push (PWA)</Label>
      <p className="text-xs text-brand-text-muted">
        Avisos de nuevas reservas en este dispositivo.
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={() => void (enabled ? disable() : enable())}
      >
        {loading
          ? "Procesando…"
          : enabled
            ? "Desactivar notificaciones"
            : "Activar notificaciones"}
      </Button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  );
}
