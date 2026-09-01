import Link from "next/link";
import { ProductCard } from "@/components/catalog/ProductCard";
import type { Product } from "@/lib/types/product";

export function FeaturedProducts({ products }: { products: Product[] }) {
  return (
    <section className="bg-white py-16 md:py-20">
      <div className="container-page">
        <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-north-steel">
              Catálogo
            </p>
            <h2 className="font-display text-3xl font-bold uppercase tracking-[0.04em] text-north-dark md:text-4xl">
              Selección del catálogo
            </h2>
          </div>
          <Link
            href="/products"
            className="text-sm font-semibold text-north-primary hover:underline"
          >
            Ver catálogo
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4 md:gap-x-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
