import { useEffect, useState } from "react";
import { fetchProducts } from "@/lib/api/products";
import { adaptProducts } from "@/lib/catalog/adapter";
import type { Product } from "@/lib/types/product";

let cachedProducts: Product[] | null = null;
let pendingLoad: Promise<Product[]> | null = null;

export function loadProducts(options?: { force?: boolean; signal?: AbortSignal }) {
  if (!options?.force && cachedProducts) return Promise.resolve(cachedProducts);
  if (!options?.force && pendingLoad) return pendingLoad;

  const load = fetchProducts({ signal: options?.signal }).then((payload) => {
    cachedProducts = adaptProducts(payload);
    return cachedProducts;
  });
  if (options?.force) return load;
  const pending = load.finally(() => {
    if (pendingLoad === pending) pendingLoad = null;
  });
  pendingLoad = pending;
  return pending;
}

export function useProducts() {
  const [state, setState] = useState({
    products: cachedProducts ?? [],
    isLoading: cachedProducts === null,
    error: null as Error | null,
  });

  useEffect(() => {
    let active = true;
    loadProducts()
      .then((products) => {
        if (active) {
          setState({ products, isLoading: false, error: null });
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setState({
            products: [],
            isLoading: false,
            error: error instanceof Error ? error : new Error("Error desconocido"),
          });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  return state;
}

export async function refreshProduct(productId: string) {
  const products = await loadProducts({ force: true });
  return products.find((product) => product.id === productId);
}
