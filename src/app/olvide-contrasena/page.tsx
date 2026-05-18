import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = { title: "Olvidé mi contraseña" };

export default function OlvideContrasenaPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-white/10 bg-brand-surface p-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <BrandLogo size="md" href="/" />
          <div>
            <h1 className="text-2xl font-bold">Recuperar contraseña</h1>
            <p className="mt-1 text-sm text-brand-text-muted">
              Escribe tu correo y te enviaremos un enlace para elegir una nueva
              contraseña.
            </p>
          </div>
        </div>
        <ForgotPasswordForm />
        <p className="text-center text-sm text-brand-text-muted">
          <Link href="/login" className="text-brand-gold hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
