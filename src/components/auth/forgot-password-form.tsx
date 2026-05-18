"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/actions/password-reset";

const SUCCESS_MESSAGE =
  "Si existe una cuenta con ese correo, recibirás un enlace en unos minutos. Revisa también la carpeta de spam.";

const DELIVERY_FAILED_MESSAGE =
  "No pudimos enviar el correo en este momento. Comprueba que esté bien escrito e inténtalo de nuevo en unos minutos.";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNotice(null);

    const result = await requestPasswordReset(email);

    setLoading(false);

    if (result.status === "rate_limited") {
      setNotice(result.message);
      return;
    }

    if (result.status === "delivery_failed") {
      setNotice(DELIVERY_FAILED_MESSAGE);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <p className="text-center text-sm text-brand-text-muted">{SUCCESS_MESSAGE}</p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Correo</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      {notice && (
        <p className="text-sm text-amber-400" role="status">
          {notice}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Enviando…" : "Enviar enlace"}
      </Button>
    </form>
  );
}
