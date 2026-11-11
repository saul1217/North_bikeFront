import { API_BASE_URL } from "@/lib/api/client";
import type { ApiProduct, ApiProductVariant, ProductSource } from "@/lib/api/types";
import type { Product, ProductVariant } from "@/lib/types/product";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function toAssetUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return new URL(value.replace(/^\//, ""), `${API_BASE_URL}/`).toString();
}

const categoryGroups: Record<string, string> = {
  bicicletas: "bicicletas",
  componentes: "componentes",
  pedales: "componentes",
  proteccion: "proteccion",
  cascos: "proteccion",
  guantes: "proteccion",
  accesorios: "accesorios",
  herramientas: "accesorios",
  ropa: "ropa",
  jerseys: "ropa",
  llantas: "llantas",
};

function toVariant(variant: ApiProductVariant): ProductVariant {
  const type = variant.size ? "size" : variant.color ? "color" : "option";
  const value = variant.size || variant.color || variant.model || variant.label;

  return {
    id: variant.id,
    label: variant.label,
    type,
    value,
    price: Number(variant.price),
    stock: variant.stock,
  };
}

/**
 * Maps only fields that the backend actually exposes. The slug is a stable
 * frontend route key derived from name + id because the API has no slug field.
 */
export function adaptProduct(apiProduct: ApiProduct, source: ProductSource = "pos"): Product {
  const rawImages = [
    ...(apiProduct.images ?? []),
    ...(apiProduct.image ? [apiProduct.image] : []),
  ].filter((image): image is string => Boolean(image?.trim()));
  const variants = (apiProduct.variants ?? []).map(toVariant);
  const sizes = variants
    .filter((variant) => variant.type === "size")
    .map((variant) => variant.value);

  return {
    id: apiProduct.id,
    source,
    slug: `${slugify(apiProduct.name) || "producto"}-${apiProduct.id}`,
    name: apiProduct.name,
    brand: apiProduct.brand ?? undefined,
    category: apiProduct.category,
    categoryGroup: categoryGroups[apiProduct.category.toLowerCase()] ?? apiProduct.category,
    price: Number(apiProduct.price),
    compareAtPrice: apiProduct.compareAtPrice == null ? undefined : Number(apiProduct.compareAtPrice),
    images: rawImages.map(toAssetUrl),
    description: apiProduct.description ?? undefined,
    features: apiProduct.features ?? [],
    specifications: apiProduct.specifications ?? {},
    variants,
    stock: apiProduct.stock,
    featured: apiProduct.featured ?? false,
    isNew: apiProduct.isNew ?? false,
    bikeType: apiProduct.bikeType ?? undefined,
    compatibility: apiProduct.compatibility ?? undefined,
    sizes: sizes.length ? [...new Set(sizes)] : undefined,
    sourceUpdatedAt: apiProduct.updatedAt,
  };
}

/**
 * El origen lo decide la ruta que entregó el producto (no el campo opcional
 * de la respuesta), para no mezclar catálogos aunque un backend anterior no
 * mande `source`.
 */
export function adaptProducts(apiProducts: ApiProduct[], source: ProductSource = "pos") {
  return apiProducts
    .filter((product) => product.status === "activo")
    .map((product) => adaptProduct(product, source));
}

export function productKey(product: { id: string; source?: ProductSource }) {
  return `${product.source ?? "pos"}:${product.id}`;
}

/** Une ambos catálogos sin duplicar la misma pareja origen + id. */
export function combineCatalogs(pos: Product[], manual: Product[]) {
  const seen = new Set<string>();
  return [...pos, ...manual].filter((product) => {
    const key = productKey(product);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function variantMatchesLabel(variant: ProductVariant, label?: string) {
  return Boolean(label) && variant.label === label;
}
