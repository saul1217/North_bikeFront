import { useEffect, useState } from "react";
import { fetchOnlineProducts, fetchProducts } from "@/lib/api/products";
import type { ProductSource } from "@/lib/api/types";
import { adaptProducts, combineCatalogs } from "@/lib/catalog/adapter";
import type { Product } from "@/lib/types/product";

/**
 * Catálogo de la tienda: productos del POS publicados (GET /api/products) y
 * productos manuales publicados (GET /api/online-products). Si una de las dos
 * fuentes falla se muestran solo los de la otra, sin inventar artículos, y se
 * informa cuál faltó (`failedSources`).
 */
export type Catalog = {
  products: Product[];
  failedSources: ProductSource[];
};

let cachedCatalog: Catalog | null = null;
let pendingLoad: Promise<Catalog> | null = null;

async function fetchCatalog(signal?: AbortSignal): Promise<Catalog> {
  const [pos, manual] = await Promise.allSettled([
    fetchProducts({ signal }),
    fetchOnlineProducts({ signal }),
  ]);
  if (pos.status === "rejected" && manual.status === "rejected") throw pos.reason;
  const failedSources: ProductSource[] = [];
  if (pos.status === "rejected") failedSources.push("pos");
  if (manual.status === "rejected") failedSources.push("manual");
  return {
    products: combineCatalogs(
      pos.status === "fulfilled" ? adaptProducts(pos.value, "pos") : [],
      manual.status === "fulfilled" ? adaptProducts(manual.value, "manual") : [],
    ),
    failedSources,
  };
}

export function loadCatalog(options?: { force?: boolean; signal?: AbortSignal }) {
  if (!options?.force && cachedCatalog) return Promise.resolve(cachedCatalog);
  if (!options?.force && pendingLoad) return pendingLoad;

  const load = fetchCatalog(options?.signal).then((catalog) => {
    cachedCatalog = catalog;
    return catalog;
  });
  if (options?.force) return load;
  const pending = load.finally(() => {
    if (pendingLoad === pending) pendingLoad = null;
  });
  pendingLoad = pending;
  return pending;
}

export function loadProducts(options?: { force?: boolean; signal?: AbortSignal }) {
  return loadCatalog(options).then((catalog) => catalog.products);
}

export function useProducts() {
  const [state, setState] = useState({
    products: cachedCatalog?.products ?? [],
    failedSources: cachedCatalog?.failedSources ?? ([] as ProductSource[]),
    isLoading: cachedCatalog === null,
    error: null as Error | null,
  });

  useEffect(() => {
    let active = true;
    // Con catálogo en memoria se muestra de inmediato, pero se vuelve a pedir
    // al servidor: si el panel publicó o retiró algo en esta misma pestaña, la
    // tienda no debe quedarse con la lista vieja hasta recargar la página.
    const hadCache = cachedCatalog !== null;
    loadCatalog({ force: hadCache })
      .then((catalog) => {
        if (active) {
          setState({ products: catalog.products, failedSources: catalog.failedSources, isLoading: false, error: null });
        }
      })
      .catch((error: unknown) => {
        // Si falla la revalidación, se conserva lo que ya se mostraba.
        if (active && !hadCache) {
          setState({
            products: [],
            failedSources: [],
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

/** Vuelve a consultar el catálogo y busca el producto por id y origen. */
export async function refreshProduct(productId: string, source: ProductSource = "pos") {
  const catalog = await loadCatalog({ force: true });
  const product = catalog.products.find((item) => item.id === productId && item.source === source);
  if (!product && catalog.failedSources.includes(source)) {
    throw new Error("No pudimos validar el inventario de este producto. Inténtalo de nuevo en unos segundos.");
  }
  return product;
}
