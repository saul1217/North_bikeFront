import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  variant?: "dark" | "light";
  className?: string;
};

export function BrandLogo({ variant = "dark", className = "" }: BrandLogoProps) {
  return (
    <Link
      href="/"
      className={`inline-flex shrink-0 items-center ${
        variant === "light" ? "bg-white p-1" : ""
      } ${className}`}
      aria-label="North Bike — inicio"
    >
      <Image
        src="/brand/logo.webp"
        alt="North Bike"
        width={384}
        height={384}
        priority
        className="h-12 w-12 object-contain md:h-14 md:w-14"
      />
    </Link>
  );
}
