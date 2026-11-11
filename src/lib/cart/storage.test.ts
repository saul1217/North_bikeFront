import { describe, expect, it } from "vitest";
import { cartLineKey, normalizeCartItems } from "./storage";

const base = { slug: "casco-1", name: "Casco", image: "", price: 500, quantity: 1, maxStock: 3 };

describe("carrito guardado", () => {
  it("interpreta un carrito anterior sin source como pos", () => {
    const [item] = normalizeCartItems([{ ...base, productId: "cmx1" }]);
    expect(item.source).toBe("pos");
  });

  it("conserva source manual al restaurar", () => {
    const [item] = normalizeCartItems([{ ...base, productId: "onl_1", source: "manual" }]);
    expect(item.source).toBe("manual");
  });

  it("descarta líneas corruptas y valores no válidos", () => {
    expect(normalizeCartItems("x")).toEqual([]);
    expect(normalizeCartItems([null, { name: "sin id" }, { ...base, productId: "a", source: "otro" }])).toEqual([
      { ...base, productId: "a", source: "pos" },
    ]);
  });

  it("no confunde artículos con el mismo id de distinto origen", () => {
    expect(cartLineKey({ productId: "x", source: "pos" })).not.toBe(cartLineKey({ productId: "x", source: "manual" }));
    expect(cartLineKey({ productId: "x" })).toBe(cartLineKey({ productId: "x", source: "pos" }));
  });
});
