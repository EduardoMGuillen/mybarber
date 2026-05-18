"use client";

import Link from "next/link";
import { FooterExtras } from "@/components/layout/footer-extras";

export function ShopLandingFooterExtras() {
  return (
    <FooterExtras>
      <p className="text-xs">
        Reservas con{" "}
        <Link href="/" className="text-brand-gold hover:underline">
          MiBarbería
        </Link>
      </p>
    </FooterExtras>
  );
}
