/**
 * Costo de envío a domicilio que se muestra antes de cobrar.
 *
 * North Bike sí envía a domicilio, pero la tarifa la define el negocio y la
 * calcula el backend. El front nunca inventa un importe: mientras el servidor
 * no confirme uno, el envío queda «por confirmar» y ese pedido no pasa a Stripe.
 * Recoger en tienda no lleva cargo de envío.
 */
export type ShippingQuote =
  | { status: "pending" }
  /** Importe en MXN calculado por el backend. `free` solo si una regla autorizada lo hace gratis. */
  | { status: "confirmed"; amount: number; free?: boolean };

/**
 * Todavía no hay una tarifa de envío autorizada ni un endpoint que la cotice
 * (ver docs/envios.md). Cuando el backend la exponga, la cotización sustituye a esto.
 */
export const SHIPPING_QUOTE_PENDING: ShippingQuote = { status: "pending" };

export const SHIPPING_PENDING_LABEL = "Costo de envío por confirmar";
export const SHIPPING_PENDING_MESSAGE =
  "El costo del envío a domicilio todavía está por confirmar, así que aún no podemos cobrar este pedido en línea. Puedes elegir «Recoger en tienda» o volver más tarde para pagarlo con envío.";

export type CheckoutSummary =
  | { method: "pickup"; shipping: 0; total: number; canPay: true }
  | { method: "shipping"; shipping: null; total: null; canPay: false }
  | { method: "shipping"; shipping: number; total: number; canPay: true; free: boolean };

/** Suma en centavos para que el total mostrado sea el mismo que cobra Stripe. */
function addMoney(a: number, b: number) {
  return Math.round(a * 100 + b * 100) / 100;
}

export function summarizeCheckout(subtotal: number, method: "pickup" | "shipping", quote: ShippingQuote): CheckoutSummary {
  if (method === "pickup") return { method, shipping: 0, total: subtotal, canPay: true };
  if (quote.status !== "confirmed" || !Number.isFinite(quote.amount) || quote.amount < 0) {
    return { method, shipping: null, total: null, canPay: false };
  }
  // Un envío en $0 solo se acepta si el servidor lo marca como gratis por una regla autorizada.
  if (quote.amount === 0 && quote.free !== true) return { method, shipping: null, total: null, canPay: false };
  return { method, shipping: quote.amount, total: addMoney(subtotal, quote.amount), canPay: true, free: quote.amount === 0 };
}
