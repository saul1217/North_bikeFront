"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import type { Product } from "@/lib/types/product";
import {
  filterProducts,
  getAvailableSizes,
  getPriceBounds,
  getUniqueBrands,
  type CatalogFilters,
  type SortOption,
} from "@/lib/catalog/filters";
import { bikeTypeLabels, categoryLabels } from "@/lib/data/categories";
import { ProductCard } from "@/components/catalog/ProductCard";

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "featured", label: "Destacados" },
  { value: "price-asc", label: "Precio: menor" },
  { value: "price-desc", label: "Precio: mayor" },
  { value: "newest", label: "Nuevos" },
];

type Props = {
  products: Product[];
};

function FiltersForm({
  products,
  values,
  onChange,
  onClear,
}: {
  products: Product[];
  values: CatalogFilters;
  onChange: (patch: Partial<CatalogFilters>) => void;
  onClear: () => void;
}) {
  const brands = useMemo(() => getUniqueBrands(products), [products]);
  const sizes = useMemo(() => getAvailableSizes(products), [products]);
  const bounds = useMemo(() => getPriceBounds(products), [products]);
  const categories = Object.keys(categoryLabels);
  const bikeTypes = Object.keys(bikeTypeLabels);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold uppercase tracking-[0.08em]">
          Filtros
        </h2>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-semibold uppercase tracking-wider text-north-primary hover:underline"
        >
          Limpiar
        </button>
      </div>

      <fieldset>
        <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-north-steel">
          Categoría
        </legend>
        <div className="space-y-2">
          {categories.map((cat) => (
            <label key={cat} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="category"
                checked={(values.category ?? "") === cat}
                onChange={() => onChange({ category: cat })}
                className="accent-north-primary"
              />
              {categoryLabels[cat]}
            </label>
          ))}
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="category"
              checked={!values.category}
              onChange={() => onChange({ category: undefined })}
              className="accent-north-primary"
            />
            Todas
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-north-steel">
          Marca
        </legend>
        <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
          {brands.map((brand) => (
            <label key={brand} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="brand"
                checked={(values.brand ?? "") === brand}
                onChange={() => onChange({ brand })}
                className="accent-north-primary"
              />
              {brand}
            </label>
          ))}
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="brand"
              checked={!values.brand}
              onChange={() => onChange({ brand: undefined })}
              className="accent-north-primary"
            />
            Todas
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-north-steel">
          Precio (MXN)
        </legend>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min={bounds.min}
            max={bounds.max}
            placeholder={`Min ${bounds.min}`}
            value={values.minPrice ?? ""}
            onChange={(e) =>
              onChange({
                minPrice: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="h-10 border border-north-border px-2 text-sm outline-none focus:border-north-primary"
          />
          <input
            type="number"
            min={bounds.min}
            max={bounds.max}
            placeholder={`Max ${bounds.max}`}
            value={values.maxPrice ?? ""}
            onChange={(e) =>
              onChange({
                maxPrice: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="h-10 border border-north-border px-2 text-sm outline-none focus:border-north-primary"
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-north-steel">
          Tipo de bicicleta
        </legend>
        <div className="space-y-2">
          {bikeTypes.map((type) => (
            <label key={type} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="bikeType"
                checked={(values.bikeType ?? "") === type}
                onChange={() => onChange({ bikeType: type })}
                className="accent-north-primary"
              />
              {bikeTypeLabels[type]}
            </label>
          ))}
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="bikeType"
              checked={!values.bikeType}
              onChange={() => onChange({ bikeType: undefined })}
              className="accent-north-primary"
            />
            Todos
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-north-steel">
          Talla
        </legend>
        <div className="flex flex-wrap gap-2">
          {sizes.map((size) => {
            const active = values.size === size;
            return (
              <button
                key={size}
                type="button"
                onClick={() =>
                  onChange({ size: active ? undefined : size })
                }
                className={`min-w-10 border px-2 py-1.5 text-sm ${
                  active
                    ? "border-north-dark bg-north-dark text-white"
                    : "border-north-border text-north-dark hover:border-north-steel"
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-north-steel">
          Disponibilidad
        </legend>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="availability"
              checked={(values.availability ?? "all") === "all"}
              onChange={() => onChange({ availability: "all" })}
              className="accent-north-primary"
            />
            Todas
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="availability"
              checked={values.availability === "in-stock"}
              onChange={() => onChange({ availability: "in-stock" })}
              className="accent-north-primary"
            />
            En stock
          </label>
        </div>
      </fieldset>
    </div>
  );
}

export function CatalogView({ products }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const queryKey = searchParams.toString();

  const values = useMemo<CatalogFilters>(() => {
    const params = new URLSearchParams(queryKey);
    return {
      category: params.get("category") ?? undefined,
      brand: params.get("brand") ?? undefined,
      bikeType: params.get("bikeType") ?? undefined,
      size: params.get("size") ?? undefined,
      availability: params.get("availability") ?? "all",
      minPrice: params.get("minPrice")
        ? Number(params.get("minPrice"))
        : undefined,
      maxPrice: params.get("maxPrice")
        ? Number(params.get("maxPrice"))
        : undefined,
      q: params.get("q") ?? undefined,
      sort: (params.get("sort") as SortOption) || "featured",
    };
  }, [queryKey]);

  const filtered = useMemo(
    () => filterProducts(products, values),
    [products, values],
  );

  function pushFilters(next: CatalogFilters) {
    const params = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => {
      if (value === undefined || value === "" || value === "all") return;
      if (key === "sort" && value === "featured") return;
      params.set(key, String(value));
    });
    startTransition(() => {
      router.push(`/products?${params.toString()}`);
    });
  }

  function patch(partial: Partial<CatalogFilters>) {
    pushFilters({ ...values, ...partial });
  }

  function clear() {
    const q = values.q;
    pushFilters({ q, sort: "featured", availability: "all" });
    setMobileFiltersOpen(false);
  }

  return (
    <div className="container-page py-8 md:py-12">
      <div className="mb-8">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-north-steel">
          Catálogo
        </p>
        <h1 className="font-display text-4xl font-bold uppercase tracking-[0.04em] text-north-dark md:text-5xl">
          Productos
        </h1>
        {values.q && (
          <p className="mt-2 text-sm text-north-muted">
            Resultados para “{values.q}”
          </p>
        )}
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-north-muted">
          {filtered.length}{" "}
          {filtered.length === 1 ? "producto" : "productos"}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="inline-flex h-10 items-center gap-2 border border-north-border px-3 text-sm font-medium lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
          </button>
          <label className="flex items-center gap-2 text-sm">
            <span className="hidden text-north-muted sm:inline">Ordenar</span>
            <select
              value={values.sort ?? "featured"}
              onChange={(e) =>
                patch({ sort: e.target.value as SortOption })
              }
              className="h-10 border border-north-border bg-white px-2 text-sm outline-none focus:border-north-primary"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-28 border border-north-border bg-white p-5">
            <FiltersForm
              products={products}
              values={values}
              onChange={patch}
              onClear={clear}
            />
          </div>
        </aside>

        <div>
          {filtered.length === 0 ? (
            <div className="border border-north-border bg-white px-6 py-16 text-center">
              <p className="font-display text-2xl font-semibold text-north-dark">
                Sin resultados
              </p>
              <p className="mt-2 text-sm text-north-muted">
                Prueba limpiar filtros o buscar otro término.
              </p>
              <button
                type="button"
                onClick={clear}
                className="mt-6 text-sm font-semibold text-north-primary hover:underline"
              >
                Limpiar filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filters drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          mobileFiltersOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          className={`absolute inset-0 bg-north-dark/50 transition-opacity ${
            mobileFiltersOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMobileFiltersOpen(false)}
        />
        <div
          className={`absolute inset-y-0 left-0 flex w-full max-w-sm flex-col bg-white shadow-xl transition-transform duration-300 ${
            mobileFiltersOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-north-border px-4 py-4">
            <h2 className="font-display text-lg font-bold uppercase tracking-wide">
              Filtros
            </h2>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              aria-label="Cerrar filtros"
              className="p-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            <FiltersForm
              products={products}
              values={values}
              onChange={patch}
              onClear={clear}
            />
          </div>
          <div className="border-t border-north-border p-4">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="h-11 w-full bg-north-primary text-sm font-semibold text-white"
            >
              Ver {filtered.length} productos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
