import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  href?: string;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: { width: 120, height: 40, className: "h-8 w-auto" },
  md: { width: 160, height: 53, className: "h-10 w-auto" },
  lg: { width: 220, height: 73, className: "h-14 w-auto" },
};

export function BrandLogo({ className, href = "/", size = "md" }: BrandLogoProps) {
  const s = sizes[size];
  const img = (
    <Image
      src="/brand/mibarberia-logo.png"
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
