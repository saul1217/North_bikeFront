export type CartItem = {
  productId: string;
  /**
   * Origen del inventario. Los carritos guardados antes de los dos modos no
   * lo traen: al cargarlos se interpretan como "pos".
   */
  source: "pos" | "manual";
  slug: string;
  name: string;
  brand?: string;
  image: string;
  price: number;
  quantity: number;
  variantId?: string;
  variantLabel?: string;
  maxStock: number;
};

export type CartState = {
  items: CartItem[];
};

export const CART_STORAGE_KEY = "northbike-cart";

export function calcSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function calcItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

/** Referencia única de una línea del carrito: origen + producto + variante. */
export type CartLineRef = Pick<CartItem, "productId" | "variantId" | "variantLabel"> & {
  source?: CartItem["source"];
};

export function cartLineKey(item: CartLineRef) {
  return `${item.source ?? "pos"}::${item.productId}::${item.variantId ?? item.variantLabel ?? ""}`;
}

/** Acepta carritos guardados por versiones anteriores (sin `source` = POS). */
export function normalizeCartItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((raw) => {
    if (!raw || typeof raw !== "object") return [];
    const item = raw as Partial<CartItem>;
    if (typeof item.productId !== "string" || typeof item.quantity !== "number") return [];
    return [{ ...item, source: item.source === "manual" ? "manual" : "pos" } as CartItem];
  });
}

export function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    return normalizeCartItems(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}
