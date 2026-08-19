import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types/product";
import { Price } from "@/components/ui/Price";
import { Badge } from "@/components/ui/Badge";

export function ProductCard({ product }: { product: Product }) {
  const onSale = Boolean(
    product.compareAtPrice && product.compareAtPrice > product.price,
  );

  return (
    <article className="group flex flex-col">
      <Link
        href={`/products/${product.slug}`}
        className="relative mb-3 aspect-[4/5] overflow-hidden bg-north-border"
      >
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className="object-cover transition duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {onSale && <Badge tone="sale">Oferta</Badge>}
          {product.isNew && <Badge tone="primary">Nuevo</Badge>}
          {product.stock === 0 && <Badge tone="muted">Agotado</Badge>}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-north-steel">
          {product.brand}
        </p>
        <Link
          href={`/products/${product.slug}`}
          className="font-display text-lg font-semibold leading-tight tracking-wide text-north-dark transition group-hover:text-north-primary"
        >
          {product.name}
        </Link>
        <Price
          price={product.price}
          compareAtPrice={product.compareAtPrice}
          size="sm"
          className="mt-auto pt-2"
        />
      </div>
    </article>
  );
}
