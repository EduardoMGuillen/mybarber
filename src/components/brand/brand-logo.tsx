import Image from "next/image";
import Link from "next/link";
import { BRAND_LOGO_SRC } from "@/lib/brand";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  href?: string;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: { width: 32, height: 32, className: "h-8 w-8 object-contain" },
  md: { width: 40, height: 40, className: "h-10 w-10 object-contain" },
  lg: { width: 56, height: 56, className: "h-14 w-14 object-contain" },
};

export function BrandLogo({ className, href = "/", size = "md" }: BrandLogoProps) {
  const s = sizes[size];
  const img = (
    <Image
      src={BRAND_LOGO_SRC}
      alt="MiBarbería"
      width={s.width}
      height={s.height}
      className={cn(s.className, className)}
      priority
    />
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0">
        {img}
      </Link>
    );
  }

  return img;
}
