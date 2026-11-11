import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Route = { status: number; body: unknown };

function apiProduct(id: string, extra: Record<string, unknown> = {}) {
  return { id, sku: id, name: `Producto ${id}`, category: "accesorios", price: 100, stock: 3, minStock: 0, status: "activo", hasVariants: false, requiresSerial: false, variants: [], ...extra };
}

function mockApi(routes: Record<string, Route>) {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    const path = new URL(url).pathname.replace(/^\/api/, "");
    const route = routes[path];
    if (!route) throw new TypeError("network");
    return new Response(JSON.stringify(route.body), { status: route.status });
  }));
}

async function freshModule() {
  vi.resetModules();
  return import("./useProducts");
}

beforeEach(() => {
  vi.stubGlobal("window", globalThis);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("catálogo con dos fuentes", () => {
  it("une productos del POS y manuales con su origen", async () => {
    mockApi({
      "/products": { status: 200, body: [apiProduct("cmx1"), apiProduct("cmx2", { status: "inactivo" })] },
      "/online-products": { status: 200, body: [apiProduct("onl_1", { source: "manual" })] },
    });
    const { loadCatalog } = await freshModule();
    const catalog = await loadCatalog();
    expect(catalog.failedSources).toEqual([]);
    expect(catalog.products.map((product) => [product.id, product.source])).toEqual([["cmx1", "pos"], ["onl_1", "manual"]]);
  });

  it("el origen lo decide la ruta, no el campo de la respuesta", async () => {
    mockApi({
      "/products": { status: 200, body: [apiProduct("cmx1")] },
      "/online-products": { status: 200, body: [apiProduct("onl_1", { source: "pos" })] },
    });
    const { loadCatalog } = await freshModule();
    expect((await loadCatalog()).products.find((product) => product.id === "onl_1")?.source).toBe("manual");
  });

  it("backend sin modo manual (404): catálogo manual vacío, sin aviso", async () => {
    mockApi({
      "/products": { status: 200, body: [apiProduct("cmx1")] },
      "/online-products": { status: 404, body: { message: "Cannot GET" } },
    });
    const { loadCatalog } = await freshModule();
    const catalog = await loadCatalog();
    expect(catalog.failedSources).toEqual([]);
    expect(catalog.products).toHaveLength(1);
  });

  it("si una fuente falla muestra solo la otra e informa cuál faltó", async () => {
    mockApi({
      "/products": { status: 500, body: { message: "boom" } },
      "/online-products": { status: 200, body: [apiProduct("onl_1")] },
    });
    const { loadCatalog, refreshProduct } = await freshModule();
    const catalog = await loadCatalog();
    expect(catalog.failedSources).toEqual(["pos"]);
    expect(catalog.products.map((product) => product.id)).toEqual(["onl_1"]);
    await expect(refreshProduct("cmx1", "pos")).rejects.toThrow(/validar el inventario/);
    expect((await refreshProduct("onl_1", "manual"))?.source).toBe("manual");
    await expect(refreshProduct("onl_1", "pos")).rejects.toThrow(/validar el inventario/);
  });

  it("si fallan ambas fuentes devuelve error", async () => {
    mockApi({});
    const { loadCatalog } = await freshModule();
    await expect(loadCatalog()).rejects.toThrow();
  });
});

describe("catálogo en memoria (#78)", () => {
  it("al volver a montar la tienda se vuelve a pedir el catálogo y refleja lo publicado", async () => {
    let published = ["cmx1"];
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      const path = new URL(url).pathname.replace(/^\/api/, "");
      const body = path === "/products" ? published.map((id) => apiProduct(id)) : [];
      return new Response(JSON.stringify(body), { status: 200 });
    }));
    const { loadCatalog } = await freshModule();
    expect((await loadCatalog()).products.map((product) => product.id)).toEqual(["cmx1"]);
    published = ["cmx1", "cmx2"];
    // Sin force, la segunda carga sale de la memoria (comportamiento anterior).
    expect((await loadCatalog()).products.map((product) => product.id)).toEqual(["cmx1"]);
    // Con force (lo que hace useProducts al montarse con caché), sale lo nuevo.
    expect((await loadCatalog({ force: true })).products.map((product) => product.id)).toEqual(["cmx1", "cmx2"]);
  });
});
