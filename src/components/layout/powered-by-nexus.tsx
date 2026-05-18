import { NEXUS_GLOBAL_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function PoweredByNexus({ className }: Props) {
  return (
    <p className={cn("text-xs text-brand-text-muted", className)}>
      Powered by{" "}
      <a
        href={NEXUS_GLOBAL_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-brand-text-muted transition-colors hover:text-brand-gold"
      >
        Nexus Global
      </a>
    </p>
  );
}
