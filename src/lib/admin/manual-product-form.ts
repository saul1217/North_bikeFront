import type { AdminManualProduct, ManualProductInput } from "@/lib/api/admin-types";
import { ApiRequestError } from "@/lib/api/types";

/** Valores del formulario tal como se capturan (texto). */
export type ManualProductFormValues = {
  name: string;
  description: string;
  category: string;
  sku: string;
  price: string;
  stock: string;
  images: string[];
  published: boolean;
};

export type ManualProductFormErrors = Partial<Record<keyof ManualProductFormValues, string>>;

export const emptyManualProductForm: ManualProductFormValues = {
  name: "",
  description: "",
  category: "",
  sku: "",
  price: "",
  stock: "",
  images: [],
  published: false,
};

export const MAX_MANUAL_IMAGES = 12;
const skuPattern = /^[A-Za-z0-9._-]+$/;
const pricePattern = /^\d+(\.\d{1,2})?$/;
const stockPattern = /^\d+$/;

export function formFromProduct(product: AdminManualProduct): ManualProductFormValues {
  return {
    name: product.name,
    description: product.description ?? "",
    category: product.category,
    sku: product.sku ?? "",
    price: String(product.price),
    stock: String(product.stock),
    images: [...product.images],
    published: product.published,
  };
}

export function isHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/** Mismas reglas que CreateManualProductDto del backend (PR #2). */
export function validateManualProductForm(values: ManualProductFormValues): ManualProductFormErrors {
  const errors: ManualProductFormErrors = {};
  const name = values.name.trim();
  const category = values.category.trim();
  const sku = values.sku.trim();
  const price = values.price.trim();
  const stock = values.stock.trim();

  if (name.length < 2 || name.length > 160) errors.name = "Escribe un nombre de 2 a 160 caracteres.";
  if (!category) errors.category = "La categoría es obligatoria.";
  else if (category.length > 80) errors.category = "La categoría admite hasta 80 caracteres.";
  if (values.description.trim().length > 5000) errors.description = "La descripción admite hasta 5000 caracteres.";
  if (sku && (sku.length > 60 || !skuPattern.test(sku))) errors.sku = "El SKU solo admite letras, números, punto, guion y guion bajo (máx. 60).";
  if (!price) errors.price = "El precio es obligatorio.";
  else if (!pricePattern.test(price) || Number(price) > 9_999_999) errors.price = "Escribe un precio en MXN no negativo, con hasta dos decimales.";
  if (!stock) errors.stock = "El stock es obligatorio.";
  else if (!stockPattern.test(stock) || Number(stock) > 100_000) errors.stock = "El stock debe ser un número entero de 0 a 100000.";
  if (values.images.length > MAX_MANUAL_IMAGES) errors.images = `Máximo ${MAX_MANUAL_IMAGES} imágenes.`;
  else if (values.images.some((url) => !isHttpsUrl(url) || url.length > 2048)) errors.images = "Cada imagen debe ser una URL que empiece con https://.";
  return errors;
}

function toInput(values: ManualProductFormValues) {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    category: values.category.trim(),
    sku: values.sku.trim(),
    price: Number(values.price.trim()),
    stock: Number(values.stock.trim()),
    images: values.images,
    published: values.published,
  };
}

/** Cuerpo del alta. Nunca publica automáticamente salvo que el administrador lo marque. */
export function toCreateInput(values: ManualProductFormValues): ManualProductInput {
  const input = toInput(values);
  return {
    name: input.name,
    category: input.category,
    price: input.price,
    stock: input.stock,
    images: input.images,
    published: input.published,
    ...(input.description ? { description: input.description } : {}),
    ...(input.sku ? { sku: input.sku } : {}),
  };
}

/**
 * Cuerpo del PATCH: solo los campos que cambiaron. Así no se reescribe el
 * stock si el administrador no lo tocó (un pedido pudo apartar piezas mientras
 * el formulario estaba abierto). La publicación se cambia con su propia ruta.
 */
export function toUpdatePatch(original: AdminManualProduct, values: ManualProductFormValues): ManualProductInput {
  const input = toInput(values);
  const patch: ManualProductInput = {};
  if (input.name !== original.name) patch.name = input.name;
  if (input.description !== (original.description ?? "")) patch.description = input.description;
  if (input.category !== original.category) patch.category = input.category;
  if (input.sku !== (original.sku ?? "")) patch.sku = input.sku || null;
  if (input.price !== original.price) patch.price = input.price;
  if (input.stock !== original.stock) patch.stock = input.stock;
  if (JSON.stringify(input.images) !== JSON.stringify(original.images)) patch.images = input.images;
  return patch;
}

/** Mensaje claro para los errores del panel de productos. */
export function adminProductErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiRequestError) {
    if (error.status === 409) return error.message?.toLowerCase().includes("sku") ? `${error.message}. Usa otro SKU o déjalo vacío.` : error.message || "Hay un conflicto con los datos de este producto.";
    if (error.status === 401) return "Tu sesión expiró. Inicia sesión de nuevo.";
    if (error.status === 403) return "Tu cuenta no tiene permiso para administrar la tienda en línea.";
    if (error.status === 404) return "El producto ya no existe o fue retirado. Actualiza la lista.";
    if (error.status === 400) return error.message ? `Revisa los datos: ${error.message}.` : "Revisa los datos del producto.";
    return error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}
