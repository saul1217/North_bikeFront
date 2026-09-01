import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/types/product";
import { Price } from "@/components/ui/Price";
import { Badge } from "@/components/ui/Badge";
import { Package } from "lucide-react";

export function ProductCard({ product }: { product: Product }) {
  const [imageFailed, setImageFailed] = useState(false);
  const onSale = Boolean(
    product.compareAtPrice && product.compareAtPrice > product.price,
  );

  return (
    <article className="group flex flex-col">
      <Link
        href={`/products/${product.slug}`}
        className="relative mb-3 aspect-[4/5] overflow-hidden bg-north-border"
      >
        {product.images[0] && !imageFailed ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-north-steel">
            <Package className="h-10 w-10" aria-hidden="true" />
            <span className="sr-only">Imagen no disponible</span>
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {onSale && <Badge tone="sale">Oferta</Badge>}
          {product.isNew && <Badge tone="primary">Nuevo</Badge>}
          {product.stock === 0 && <Badge tone="muted">Agotado</Badge>}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-1">
        {product.brand && (
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-north-steel">
            {product.brand}
          </p>
        )}
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
