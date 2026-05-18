"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/actions/password-reset";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [googleOnly, setGoogleOnly] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await requestPasswordReset(email);
      if (result.googleOnly) {
        setGoogleOnly(true);
        return;
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar el correo");
    } finally {
      setLoading(false);
    }
  }

  if (googleOnly) {
    return (
      <div className="space-y-4 text-center text-sm text-brand-text-muted">
        <p>
          Esta cuenta usa <strong className="text-brand-text">Google</strong> para
          entrar. No hay contraseña que restablecer.
        </p>
        <Button asChild className="w-full">
          <Link href="/login">Iniciar sesión con Google</Link>
        </Button>
      </div>
    );
  }

  if (sent) {
    return (
      <p className="text-center text-sm text-brand-text-muted">
        Si existe una cuenta con ese correo, recibirás un enlace en unos minutos.
        Revisa también la carpeta de spam.
      </p>
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
      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Enviando…" : "Enviar enlace"}
      </Button>
    </form>
  );
}
