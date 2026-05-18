import { PoweredByNexus } from "@/components/layout/powered-by-nexus";

export function SiteFooter() {
  return (
    <footer className="mt-auto shrink-0 border-t border-white/10 bg-brand-black/80 py-3 pb-safe backdrop-blur-sm">
      <div className="flex justify-center px-4">
        <PoweredByNexus />
      </div>
    </footer>
  );
}
