import { products } from "@/lib/data/products";
import type { BikeType, Product, ProductCategory } from "@/lib/types/product";

export type SortOption = "featured" | "price-asc" | "price-desc" | "newest";

export type CatalogFilters = {
  category?: ProductCategory | string;
  brand?: string;
  bikeType?: BikeType | string;
  size?: string;
  availability?: "in-stock" | "all" | string;
  minPrice?: number;
  maxPrice?: number;
  q?: string;
  sort?: SortOption | string;
};

export function getAllProducts(): Product[] {
  return products;
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getFeaturedProducts(limit = 8): Product[] {
  return products.filter((p) => p.featured).slice(0, limit);
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return products
    .filter(
      (p) =>
        p.id !== product.id &&
        (p.category === product.category || p.brand === product.brand),
    )
    .slice(0, limit);
}

export function getUniqueBrands(list: Product[] = products): string[] {
  return [...new Set(list.map((p) => p.brand))].sort();
}

export function getAvailableSizes(list: Product[] = products): string[] {
  const sizes = new Set<string>();
  list.forEach((p) => p.sizes?.forEach((s) => sizes.add(s)));
  return [...sizes].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

export function getPriceBounds(list: Product[] = products): {
  min: number;
  max: number;
} {
  const prices = list.map((p) => p.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function filterProducts(
  list: Product[],
  filters: CatalogFilters,
): Product[] {
  let result = [...list];

  if (filters.category) {
    result = result.filter((p) => p.category === filters.category);
  }

  if (filters.brand) {
    result = result.filter(
      (p) => p.brand.toLowerCase() === filters.brand!.toLowerCase(),
    );
  }

  if (filters.bikeType) {
    result = result.filter((p) => p.bikeType === filters.bikeType);
  }

  if (filters.size) {
    result = result.filter((p) => p.sizes?.includes(filters.size!));
  }

  if (filters.availability === "in-stock") {
    result = result.filter((p) => p.stock > 0);
  }

  if (typeof filters.minPrice === "number") {
    result = result.filter((p) => p.price >= filters.minPrice!);
  }

  if (typeof filters.maxPrice === "number") {
    result = result.filter((p) => p.price <= filters.maxPrice!);
  }

  if (filters.q?.trim()) {
    const q = filters.q.trim().toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    );
  }

  switch (filters.sort) {
    case "price-asc":
      result.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      result.sort((a, b) => b.price - a.price);
      break;
    case "newest":
      result.sort((a, b) => Number(b.isNew) - Number(a.isNew));
      break;
    case "featured":
    default:
      result.sort((a, b) => Number(b.featured) - Number(a.featured));
      break;
  }

  return result;
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(amount);
}
