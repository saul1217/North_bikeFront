import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  variant?: "dark" | "light";
  className?: string;
};

export function BrandLogo({ className = "" }: BrandLogoProps) {
  return (
    <Link
      href="/"
      className={`inline-flex shrink-0 items-center ${className}`}
      aria-label="North Bike — inicio"
    >
      <Image
        src="/brand/logo.png"
        alt="North Bike"
        width={160}
        height={160}
        priority
        className="h-10 w-10 object-contain md:h-12 md:w-12"
      />
    </Link>
  );
}
