import Link from "next/link";
import { brands } from "@/lib/data/categories";

export function BrandsBand() {
  return (
    <section id="marcas" className="border-y border-north-border bg-white py-14">
      <div className="container-page">
        <div className="mb-8 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-north-steel">
              Marcas
            </p>
            <h2 className="font-display text-3xl font-bold uppercase tracking-[0.04em] text-north-dark">
              Lo que rodamos
            </h2>
          </div>
          <Link
            href="/products"
            className="text-sm font-semibold text-north-primary hover:underline"
          >
            Filtrar por marca en catálogo
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-px bg-north-border sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/products?brand=${encodeURIComponent(brand.name)}`}
              className="flex h-20 items-center justify-center bg-white px-3 text-center font-display text-sm font-bold uppercase tracking-[0.14em] text-north-dark transition hover:bg-north-background hover:text-north-primary"
            >
              {brand.name}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
