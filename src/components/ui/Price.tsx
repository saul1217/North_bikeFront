import { formatPrice } from "@/lib/catalog/filters";

type PriceProps = {
  price: number;
  compareAtPrice?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
};

const sizeMap = {
  sm: { current: "text-sm", compare: "text-xs" },
  md: { current: "text-base", compare: "text-sm" },
  lg: { current: "text-2xl md:text-3xl", compare: "text-base" },
};

export function Price({
  price,
  compareAtPrice,
  className = "",
  size = "md",
}: PriceProps) {
  const onSale = Boolean(compareAtPrice && compareAtPrice > price);
  const s = sizeMap[size];

  return (
    <div className={`flex flex-wrap items-baseline gap-2 ${className}`}>
      <span className={`font-display font-semibold tracking-wide text-north-dark ${s.current}`}>
        {formatPrice(price)}
      </span>
      {onSale && (
        <span className={`text-north-muted line-through ${s.compare}`}>
          {formatPrice(compareAtPrice!)}
        </span>
      )}
    </div>
  );
}
