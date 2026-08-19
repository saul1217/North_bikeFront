import Link from "next/link";
import { ProductCard } from "@/components/catalog/ProductCard";
import type { Product } from "@/lib/types/product";

export function CollectionStrip({
  title,
  subtitle,
  href,
  products,
}: {
  title: string;
  subtitle: string;
  href: string;
  products: Product[];
}) {
  return (
    <section className="container-page py-16 md:py-20">
      <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-north-steel">
            {subtitle}
          </p>
          <h2 className="font-display text-3xl font-bold uppercase tracking-[0.04em] text-north-dark md:text-4xl">
            {title}
          </h2>
        </div>
        <Link href={href} className="text-sm font-semibold text-north-primary hover:underline">
          Ver colección
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
