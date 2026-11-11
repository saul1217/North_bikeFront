import { describe, expect, it } from "vitest";
import { SHIPPING_QUOTE_PENDING, summarizeCheckout } from "./shipping";

describe("resumen de envío del checkout (#80)", () => {
  it("recoger en tienda: sin cargo de envío y el total es el subtotal", () => {
    expect(summarizeCheckout(899.5, "pickup", SHIPPING_QUOTE_PENDING)).toEqual({ method: "pickup", shipping: 0, total: 899.5, canPay: true });
  });

  it("envío sin tarifa confirmada: por confirmar y no se puede pagar", () => {
    expect(summarizeCheckout(899.5, "shipping", SHIPPING_QUOTE_PENDING)).toEqual({ method: "shipping", shipping: null, total: null, canPay: false });
  });

  it("envío en $0 sin regla de gratis autorizada no se acepta", () => {
    expect(summarizeCheckout(500, "shipping", { status: "confirmed", amount: 0 }).canPay).toBe(false);
  });

  it("importes inválidos del servidor no se aceptan", () => {
    expect(summarizeCheckout(500, "shipping", { status: "confirmed", amount: -10 }).canPay).toBe(false);
    expect(summarizeCheckout(500, "shipping", { status: "confirmed", amount: Number.NaN }).canPay).toBe(false);
  });

  it("con tarifa confirmada: subtotal + envío = total, con centavos exactos", () => {
    expect(summarizeCheckout(899.1, "shipping", { status: "confirmed", amount: 149.2 })).toEqual({ method: "shipping", shipping: 149.2, total: 1048.3, canPay: true, free: false });
  });

  it("envío gratis solo cuando el servidor lo marca por regla autorizada", () => {
    expect(summarizeCheckout(1200, "shipping", { status: "confirmed", amount: 0, free: true })).toEqual({ method: "shipping", shipping: 0, total: 1200, canPay: true, free: true });
  });
});
