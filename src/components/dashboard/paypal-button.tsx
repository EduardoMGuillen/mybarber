"use client";

import { useState } from "react";
import { startPayPalSubscription } from "@/lib/actions/billing";
import { Button } from "@/components/ui/button";

export function PayPalButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const { url } = await startPayPalSubscription();
      window.location.href = url;
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error con PayPal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" className="w-full" disabled={loading} onClick={handleClick}>
      {loading ? "Redirigiendo…" : "Activar con PayPal — $20/mes"}
    </Button>
  );
}
