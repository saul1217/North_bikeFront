import { API_BASE_URL } from "@/lib/api/client";
import type { ApiProduct, ApiProductVariant } from "@/lib/api/types";
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
export function adaptProduct(apiProduct: ApiProduct): Product {
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
    slug: `${slugify(apiProduct.name) || "producto"}-${apiProduct.id}`,
    name: apiProduct.name,
    brand: undefined,
    category: apiProduct.category,
    price: Number(apiProduct.price),
    images: rawImages.map(toAssetUrl),
    description: undefined,
    features: [],
    specifications: {},
    variants,
    stock: apiProduct.stock,
    featured: undefined,
    isNew: undefined,
    bikeType: undefined,
    sizes: sizes.length ? [...new Set(sizes)] : undefined,
    sourceUpdatedAt: apiProduct.updatedAt,
  };
}

export function adaptProducts(apiProducts: ApiProduct[]) {
  return apiProducts
    .filter((product) => product.status === "activo")
    .map(adaptProduct);
}

export function variantMatchesLabel(variant: ProductVariant, label?: string) {
  return Boolean(label) && variant.label === label;
}
