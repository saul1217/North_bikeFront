import { apiRequest } from "./client";
import { ApiRequestError, type ApiProduct } from "./types";

function isApiProduct(value: unknown): value is ApiProduct {
  if (!value || typeof value !== "object") return false;
  const product = value as Partial<ApiProduct>;
  return (
    typeof product.id === "string" &&
    typeof product.sku === "string" &&
    typeof product.name === "string" &&
    typeof product.category === "string" &&
    (typeof product.price === "number" || typeof product.price === "string") &&
    typeof product.stock === "number" &&
    Array.isArray(product.variants)
  );
}

async function fetchCatalog(path: string, label: string, signal?: AbortSignal) {
  const payload = await apiRequest<unknown>(path, { signal, cache: "no-store" });

  if (!Array.isArray(payload) || !payload.every(isApiProduct)) {
    throw new ApiRequestError(`La API de ${label} devolvió una respuesta no válida.`, {
      kind: "invalid-response",
    });
  }

  return payload;
}

/** Productos del POS publicados (`source: "pos"`). */
export function fetchProducts(options?: { signal?: AbortSignal }): Promise<ApiProduct[]> {
  return fetchCatalog("/products", "productos", options?.signal);
}

/**
 * Productos manuales publicados (`source: "manual"`). Un backend sin el modo
 * manual responde 404: se toma como catálogo manual vacío para que la tienda
 * siga funcionando igual que antes.
 */
export async function fetchOnlineProducts(options?: { signal?: AbortSignal }): Promise<ApiProduct[]> {
  try {
    return await fetchCatalog("/online-products", "productos en línea", options?.signal);
  } catch (error) {
    if (error instanceof ApiRequestError && error.status === 404) return [];
    throw error;
  }
}
