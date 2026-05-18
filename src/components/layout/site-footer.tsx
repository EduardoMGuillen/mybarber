"use client";

import { PoweredByNexus } from "@/components/layout/powered-by-nexus";
import { useFooterExtras } from "@/components/layout/footer-extras";
import { cn } from "@/lib/utils";

export function SiteFooter() {
  const extras = useFooterExtras();

  return (
    <footer
      className={cn(
        "mt-auto shrink-0 border-t border-white/10 bg-brand-black/80 backdrop-blur-sm",
        extras ? "space-y-4 py-6 pb-safe" : "py-3 pb-safe",
      )}
    >
      {extras ? (
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-brand-text-muted">
          {extras}
        </div>
      ) : null}
      <div className="flex justify-center px-4">
        <PoweredByNexus />
      </div>
    </footer>
  );
}
