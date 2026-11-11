import { describe, expect, it } from "vitest";
import type { CartItem } from "@/lib/cart/storage";
import type { Product } from "@/lib/types/product";
import { findCartIssues, toCheckoutItems } from "./cart";

function line(productId: string, source: "pos" | "manual", quantity = 1, variantId?: string): CartItem {
  return { productId, source, quantity, variantId, slug: productId, name: `P ${productId}`, image: "", price: 100, maxStock: 9 };
}

function product(id: string, source: "pos" | "manual", stock: number): Product {
  return { id, source, slug: id, name: id, category: "x", price: 100, images: [], features: [], specifications: {}, variants: [], stock };
}

describe("toCheckoutItems", () => {
  it("solo POS: no manda source (compatible con el backend anterior)", () => {
    expect(toCheckoutItems([line("cmx1", "pos", 2, "var1")])).toEqual([{ productId: "cmx1", variantId: "var1", quantity: 2 }]);
  });

  it("solo manual: manda source manual obligatoriamente", () => {
    expect(toCheckoutItems([line("onl_1", "manual", 3)])).toEqual([{ productId: "onl_1", quantity: 3, source: "manual" }]);
  });

  it("mixto: cada línea con su origen y sin precios", () => {
    const payload = toCheckoutItems([line("cmx1", "pos"), line("onl_1", "manual", 2)]);
    expect(payload).toEqual([
      { productId: "cmx1", quantity: 1 },
      { productId: "onl_1", quantity: 2, source: "manual" },
    ]);
    expect(JSON.stringify(payload)).not.toContain("price");
  });
});

describe("findCartIssues", () => {
  it("marca retirados, agotados y cantidades mayores al stock", () => {
    const issues = findCartIssues(
      [line("cmx1", "pos", 1), line("onl_1", "manual", 5), line("onl_2", "manual", 1), line("cmx2", "pos", 1)],
      { products: [product("onl_1", "manual", 2), product("onl_2", "manual", 0), product("cmx2", "pos", 4)], failedSources: [] },
    );
    expect(issues.map((issue) => [issue.item.productId, issue.kind, issue.available])).toEqual([
      ["cmx1", "unavailable", 0],
      ["onl_1", "insufficient", 2],
      ["onl_2", "unavailable", 0],
    ]);
  });

  it("no confunde un id del POS con uno manual", () => {
    const issues = findCartIssues([line("same", "manual", 1)], { products: [product("same", "pos", 5)], failedSources: [] });
    expect(issues).toHaveLength(1);
  });

  it("no marca artículos de una fuente que no respondió", () => {
    expect(findCartIssues([line("onl_1", "manual")], { products: [], failedSources: ["manual"] })).toEqual([]);
  });
});
