import { describe, expect, it } from "vitest";
import { formatPrice } from "./filters";

describe("formatPrice (#78)", () => {
  it("muestra centavos cuando el precio los tiene, igual que lo que cobra Stripe", () => {
    expect(formatPrice(899.5)).toBe("$899.50");
    expect(formatPrice(1580.75)).toBe("$1,580.75");
  });
  it("sin centavos sigue como antes", () => {
    expect(formatPrice(500)).toBe("$500");
  });
});
