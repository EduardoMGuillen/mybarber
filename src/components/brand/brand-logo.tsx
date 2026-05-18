import Image from "next/image";
import Link from "next/link";
import { BRAND_LOGO_SRC } from "@/lib/brand";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  href?: string;
  size?: "sm" | "md" | "lg";
  /** Muestra "MiBarbería" en dorado junto al icono */
  showWordmark?: boolean;
};

const sizes = {
  sm: { width: 32, height: 32, className: "h-8 w-8 object-contain" },
  md: { width: 40, height: 40, className: "h-10 w-10 object-contain" },
  lg: { width: 56, height: 56, className: "h-14 w-14 object-contain" },
};

const wordmarkSize = {
  sm: "text-sm font-bold tracking-tight sm:text-base",
  md: "text-base font-bold tracking-tight sm:text-lg",
  lg: "text-lg font-bold tracking-tight sm:text-xl",
};

export function BrandLogo({
  className,
  href = "/",
  size = "md",
  showWordmark = false,
}: BrandLogoProps) {
  const s = sizes[size];
  const content = (
    <>
      <Image
        src={BRAND_LOGO_SRC}
        alt=""
        width={s.width}
        height={s.height}
        className={cn(s.className, className)}
        priority
      />
      {showWordmark && (
        <span
          className={cn(
            "max-w-[8rem] truncate text-brand-gold sm:max-w-none",
            wordmarkSize[size],
          )}
        >
          MiBarbería
        </span>
      )}
    </>
  );

  const wrapClass = cn(
    "inline-flex shrink-0 items-center gap-2",
    showWordmark && "min-w-0",
  );

  if (href) {
    return (
      <Link href={href} className={wrapClass} aria-label="MiBarbería">
        {content}
      </Link>
    );
  }

  return <span className={wrapClass}>{content}</span>;
}
