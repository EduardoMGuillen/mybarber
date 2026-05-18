import Link from "next/link";
import { BrandLogo } from "@/components/brand/brand-logo";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata = { title: "Restablecer contraseña" };

export default async function RestablecerContrasenaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-white/10 bg-brand-surface p-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <BrandLogo size="md" href="/" />
          <div>
            <h1 className="text-2xl font-bold">Nueva contraseña</h1>
            <p className="mt-1 text-sm text-brand-text-muted">
              Elige una contraseña segura de al menos 8 caracteres.
            </p>
          </div>
        </div>
        <ResetPasswordForm token={token} />
        <p className="text-center text-sm text-brand-text-muted">
          <Link href="/login" className="text-brand-gold hover:underline">
            Ir a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
