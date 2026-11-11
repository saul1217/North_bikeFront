import type { AdminOrder, EcommerceFulfillmentStatus } from "@/lib/api/types";

export const fulfillmentLabels: Record<EcommerceFulfillmentStatus, string> = {
  pending: "Pendiente",
  preparing: "Preparando",
  ready_for_pickup: "Listo para recoger",
  picked_up: "Recogido",
  shipped: "Enviado",
  delivered: "Entregado",
};

export const paymentLabels: Record<string, string> = {
  pending: "Pendiente",
  paid: "Pagado",
  cancelled: "Cancelado",
  expired: "Expirado",
  payment_failed: "Fallido",
  payment_review: "En revisión",
};

export function formatAdminPrice(amount: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 }).format(amount);
}

export function formatAdminDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Mexico_City" }).format(new Date(value));
}

export function statusTone(status: string) {
  if (["paid", "picked_up", "delivered"].includes(status)) return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (["cancelled", "expired", "payment_failed"].includes(status)) return "border-red-200 bg-red-50 text-red-800";
  if (["shipped", "ready_for_pickup"].includes(status)) return "border-blue-200 bg-blue-50 text-blue-800";
  return "border-amber-200 bg-amber-50 text-amber-900";
}

export function nextFulfillmentStatuses(order: AdminOrder) {
  if (order.status !== "paid" || order.paymentStatus !== "paid") return [];
  if (order.fulfillmentMethod === "pickup") {
    const flow = ["pending", "preparing", "ready_for_pickup", "picked_up"] as EcommerceFulfillmentStatus[];
    const next = flow[flow.indexOf(order.fulfillmentStatus) + 1];
    return next ? [next] : [];
  }
  const flow = ["pending", "preparing", "shipped", "delivered"] as EcommerceFulfillmentStatus[];
  const next = flow[flow.indexOf(order.fulfillmentStatus) + 1];
  return next ? [next] : [];
}

export type OrderComposition = "pos" | "manual" | "mixed";

export function itemSource(item: { inventorySource?: string | null }) {
  return item.inventorySource === "manual" ? "manual" : "pos";
}

export function orderComposition(order: Pick<AdminOrder, "items">): OrderComposition {
  const sources = new Set(order.items.map(itemSource));
  if (sources.size > 1) return "mixed";
  return sources.has("manual") ? "manual" : "pos";
}

export const compositionLabels: Record<OrderComposition, string> = {
  pos: "Sincronizado POS",
  manual: "Manual",
  mixed: "Mixto",
};

/**
 * Importe de las líneas del POS: es lo que el backend registra como venta de
 * caja en un pedido pagado. Solo es informativo; el total cobrado es
 * `order.total` (ecommerce_orders) y no se suman ambas cifras.
 */
export function posLinesTotal(order: Pick<AdminOrder, "items">) {
  return Math.round(order.items.filter((item) => itemSource(item) === "pos").reduce((sum, item) => sum + item.lineTotal * 100, 0)) / 100;
}
