import { describe, expect, it } from "vitest";
import { orderComposition, posLinesTotal } from "./format";

const item = (inventorySource: "pos" | "manual" | undefined, lineTotal: number) => ({ inventorySource, lineTotal }) as never;

describe("pedidos por origen", () => {
  it("sin inventorySource (backend anterior) es pos", () => {
    expect(orderComposition({ items: [item(undefined, 10)] })).toBe("pos");
  });

  it("identifica manual y mixto", () => {
    expect(orderComposition({ items: [item("manual", 10)] })).toBe("manual");
    expect(orderComposition({ items: [item("pos", 10), item("manual", 5)] })).toBe("mixed");
  });

  it("la parte de caja solo suma las líneas del POS", () => {
    expect(posLinesTotal({ items: [item("pos", 500.1), item("manual", 899.5), item(undefined, 0.2)] })).toBe(500.3);
  });
});
