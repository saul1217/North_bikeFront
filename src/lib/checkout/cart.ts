import type { CheckoutRequestItem } from "@/lib/api/types";
import { productKey } from "@/lib/catalog/adapter";
import type { Catalog } from "@/lib/catalog/useProducts";
import type { CartItem } from "@/lib/cart/storage";

/**
 * Líneas para POST /api/checkout/session. Solo se envían id, variante,
 * cantidad y, para productos manuales, `source: "manual"`; el backend calcula
 * precios e importe. Las líneas del POS van sin `source` (el backend asume
 * "pos"), igual que los carritos anteriores, para seguir siendo compatibles
 * con un backend que todavía no tenga los dos modos.
 */
export function toCheckoutItems(items: CartItem[]): CheckoutRequestItem[] {
  return items.map((item) => ({
    productId: item.productId,
    ...(item.variantId ? { variantId: item.variantId } : {}),
    quantity: item.quantity,
    ...(item.source === "manual" ? { source: "manual" as const } : {}),
  }));
}

export type CartIssue = {
  item: CartItem;
  /** "unavailable": retirado, despublicado o agotado. "insufficient": hay menos piezas que las pedidas. */
  kind: "unavailable" | "insufficient";
  available: number;
};

/**
 * Compara el carrito con el catálogo recién consultado para decir qué
 * artículo requiere atención tras un 409/400 del checkout. Los artículos de
 * una fuente que no respondió no se marcan (no se puede saber su estado).
 */
export function findCartIssues(items: CartItem[], catalog: Catalog): CartIssue[] {
  const byKey = new Map(catalog.products.map((product) => [productKey(product), product]));
  return items.flatMap((item): CartIssue[] => {
    if (catalog.failedSources.includes(item.source)) return [];
    const product = byKey.get(productKey({ id: item.productId, source: item.source }));
    if (!product) return [{ item, kind: "unavailable", available: 0 }];
    const variant = item.variantId ? product.variants.find((candidate) => candidate.id === item.variantId) : undefined;
    if (item.variantId && !variant) return [{ item, kind: "unavailable", available: 0 }];
    const available = variant?.stock ?? product.stock;
    if (available <= 0) return [{ item, kind: "unavailable", available: 0 }];
    if (item.quantity > available) return [{ item, kind: "insufficient", available }];
    return [];
  });
}
