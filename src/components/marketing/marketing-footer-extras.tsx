"use client";

import Link from "next/link";
import { FooterExtras } from "@/components/layout/footer-extras";

export function MarketingFooterExtras() {
  return (
    <FooterExtras>
      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:text-left">
        <span>© {new Date().getFullYear()} MiBarbería</span>
        <div className="flex flex-wrap justify-center gap-6 sm:justify-end">
          <Link href="/legal/terminos" className="hover:text-brand-text">
            Términos
          </Link>
          <Link href="/legal/privacidad" className="hover:text-brand-text">
            Privacidad
          </Link>
          <Link href="/login" className="hover:text-brand-gold">
            Acceder al panel
          </Link>
        </div>
      </div>
    </FooterExtras>
  );
}
