import { Suspense } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { LoginForm } from "@/components/auth/login-form";
import { LoginStatusBanner } from "@/components/auth/login-status-banner";

export const metadata = {
  title: "Iniciar sesión",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-white/10 bg-brand-surface p-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <BrandLogo size="md" href="/" />
          <div>
            <h1 className="text-2xl font-bold">Bienvenido</h1>
            <p className="mt-1 text-sm text-brand-text-muted">
              Accede a tu panel MiBarbería
            </p>
          </div>
        </div>
        <Suspense fallback={<p className="text-center text-sm">Cargando…</p>}>
          <LoginStatusBanner />
        </Suspense>
        <Suspense fallback={<p className="text-center text-sm">Cargando…</p>}>
          <LoginForm />
        </Suspense>
        <p className="text-center text-sm text-brand-text-muted">
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="text-brand-gold hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
