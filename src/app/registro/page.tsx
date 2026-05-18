"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BrandLogo } from "@/components/brand/brand-logo";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerOwner } from "@/lib/actions/register";

export default function RegistroPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const registered = await registerOwner({ name, email, password });

    if (!registered.ok) {
      setError(registered.error);
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Cuenta creada. Inicia sesión manualmente.");
      return;
    }

    router.push("/dashboard/configuracion/perfil");
    router.refresh();
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-white/10 bg-brand-surface p-8 shadow-xl shadow-black/40">
        <div className="flex flex-col items-center gap-4 text-center">
          <BrandLogo size="md" href="/" />
          <div>
            <h1 className="text-2xl font-bold">Crea tu barbería</h1>
            <p className="mt-1 text-sm text-brand-text-muted">
              7 días gratis · sin tarjeta
            </p>
          </div>
        </div>

        <GoogleAuthButton
          callbackUrl="/dashboard/configuracion/perfil"
          label="Registrarse con Google"
          disabled={loading}
        />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-brand-surface px-2 text-brand-text-muted">
              o con correo
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tu nombre</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
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
          <PasswordField
            id="password"
            label="Contraseña"
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
            required
            minLength={8}
            showStrength
          />
          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
              {error.includes("ya está registrado") && (
                <>
                  {" "}
                  <Link href="/login" className="text-brand-gold hover:underline">
                    Iniciar sesión
                  </Link>
                </>
              )}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creando cuenta…" : "Crear cuenta con correo"}
          </Button>
        </form>

        <p className="text-center text-sm text-brand-text-muted">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-brand-gold hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
