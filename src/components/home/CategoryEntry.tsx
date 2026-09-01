import Image from "next/image";
import Link from "next/link";
import { categories } from "@/lib/data/categories";

export function CategoryEntry() {
  const featured = categories.slice(0, 4);

  return (
    <section className="container-page py-16 md:py-20">
      <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-north-steel">
            Categorías
          </p>
          <h2 className="font-display text-3xl font-bold uppercase tracking-[0.04em] text-north-dark md:text-4xl">
            Encuentra tu setup
          </h2>
        </div>
        <Link
          href="/products"
          className="text-sm font-semibold text-north-primary hover:underline"
        >
          Ver todo el catálogo
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {featured.map((cat, index) => (
          <Link
            key={cat.id}
            href={cat.href}
            className={`group relative overflow-hidden bg-north-dark text-white ${
              index === 0 ? "sm:col-span-2 sm:min-h-[22rem]" : "min-h-[16rem]"
            }`}
          >
            <Image
              src={cat.image}
              alt={cat.label}
              fill
              className="object-cover opacity-70 transition duration-500 group-hover:scale-105 group-hover:opacity-55"
              sizes="(max-width: 768px) 100vw, 50vw"
              onError={(event) => { event.currentTarget.style.display = "none"; }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-north-dark via-north-dark/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
              <h3 className="font-display text-2xl font-bold uppercase tracking-[0.06em]">
                {cat.label}
              </h3>
              <p className="mt-1 max-w-xs text-sm text-white/80">
                {cat.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
