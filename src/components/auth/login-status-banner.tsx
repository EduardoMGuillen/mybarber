"use client";

import { useSearchParams } from "next/navigation";

export function LoginStatusBanner() {
  const searchParams = useSearchParams();
  const reset = searchParams.get("reset");

  if (reset !== "1") return null;

  return (
    <p
      className="rounded-lg border border-brand-gold/30 bg-brand-gold/10 px-3 py-2 text-center text-sm text-brand-gold"
      role="status"
    >
      Contraseña actualizada. Ya puedes iniciar sesión.
    </p>
  );
}
