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

export function getRelatedProducts(list: Product[], product: Product, limit = 4): Product[] {
  return list
    .filter(
      (item) =>
        item.id !== product.id &&
        (item.category === product.category ||
          (item.brand && product.brand && item.brand === product.brand)),
    )
    .slice(0, limit);
}

export function getUniqueBrands(list: Product[] = []): string[] {
  return [...new Set(list.flatMap((product) => (product.brand ? [product.brand] : [])))].sort();
}

export function getUniqueCategories(list: Product[] = []): string[] {
  return [...new Set(list.map((product) => product.category).filter(Boolean))].sort();
}

export function getAvailableSizes(list: Product[] = []): string[] {
  const sizes = new Set<string>();
  list.forEach((product) => product.sizes?.forEach((size) => sizes.add(size)));
  return [...sizes].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

export function getPriceBounds(list: Product[] = []) {
  const prices = list.map((product) => product.price).filter(Number.isFinite);
  return prices.length
    ? { min: Math.min(...prices), max: Math.max(...prices) }
    : { min: 0, max: 0 };
}

export function filterProducts(list: Product[], filters: CatalogFilters): Product[] {
  let result = [...list];

  if (filters.category) result = result.filter((product) => product.category === filters.category);
  if (filters.brand) {
    result = result.filter(
      (product) => product.brand?.toLowerCase() === filters.brand!.toLowerCase(),
    );
  }
  if (filters.bikeType) result = result.filter((product) => product.bikeType === filters.bikeType);
  if (filters.size) result = result.filter((product) => product.sizes?.includes(filters.size!));
  if (filters.availability === "in-stock") result = result.filter((product) => product.stock > 0);
  if (typeof filters.minPrice === "number") {
    result = result.filter((product) => product.price >= filters.minPrice!);
  }
  if (typeof filters.maxPrice === "number") {
    result = result.filter((product) => product.price <= filters.maxPrice!);
  }

  if (filters.q?.trim()) {
    const query = filters.q.trim().toLowerCase();
    result = result.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.brand?.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query),
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
