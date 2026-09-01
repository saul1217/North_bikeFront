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

export async function fetchProducts(options?: {
  signal?: AbortSignal;
}): Promise<ApiProduct[]> {
  const payload = await apiRequest<unknown>("/products", {
    signal: options?.signal,
    cache: "no-store",
  });

  if (!Array.isArray(payload) || !payload.every(isApiProduct)) {
    throw new ApiRequestError("La API de productos devolvió una respuesta no válida.", {
      kind: "invalid-response",
    });
  }

  return payload;
}
