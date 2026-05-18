"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { confirmPasswordReset } from "@/lib/actions/password-reset";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await confirmPasswordReset(token, password);
      router.push("/login?reset=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PasswordField
        id="password"
        label="Nueva contraseña"
        autoComplete="new-password"
        value={password}
        onChange={setPassword}
        required
        minLength={8}
        showStrength
      />
      <PasswordField
        id="confirm"
        label="Confirmar contraseña"
        autoComplete="new-password"
        value={confirm}
        onChange={setConfirm}
        required
        minLength={8}
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Guardando…" : "Restablecer"}
      </Button>
    </form>
  );
}
