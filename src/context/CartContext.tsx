"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  calcItemCount,
  calcSubtotal,
  cartLineKey,
  loadCart,
  saveCart,
  type CartItem,
  type CartLineRef,
} from "@/lib/cart/storage";
import { productKey } from "@/lib/catalog/adapter";
import { loadCatalog } from "@/lib/catalog/useProducts";

type AddItemInput = Omit<CartItem, "quantity"> & { quantity?: number };

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: AddItemInput) => void;
  removeItem: (line: CartLineRef) => void;
  setQuantity: (line: CartLineRef, quantity: number) => void;
  /** Reemplaza las líneas tras revalidarlas (por ejemplo, después de un 409 del checkout). */
  replaceItems: (items: CartItem[]) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

type Store = {
  items: CartItem[];
  isOpen: boolean;
};

let store: Store = { items: [], isOpen: false };
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function getSnapshot(): Store {
  return store;
}

function getServerSnapshot(): Store {
  return { items: [], isOpen: false };
}

function subscribe(listener: () => void) {
  if (typeof window !== "undefined" && !hydrated) {
    hydrated = true;
    store = { ...store, items: loadCart() };
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setStore(partial: Partial<Store>) {
  store = { ...store, ...partial };
  if (partial.items) saveCart(partial.items);
  emit();
}

export function CartProvider({ children }: { children: ReactNode }) {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    let cancelled = false;
    loadCatalog()
      .then(({ products, failedSources }) => {
        if (cancelled || store.items.length === 0) return;
        const byKey = new Map(products.map((product) => [productKey(product), product]));
        const nextItems = store.items.flatMap((item) => {
          // Si la fuente de este artículo no respondió, se conserva tal cual.
          if (failedSources.includes(item.source)) return [item];
          const product = byKey.get(productKey({ id: item.productId, source: item.source }));
          if (!product) return [];
          const labels = item.variantLabel?.split(" · ") ?? [];
          const variant = item.variantId
            ? product.variants.find((candidate) => candidate.id === item.variantId)
            : product.variants.find((candidate) => labels.includes(candidate.label));
          const maxStock = variant?.stock ?? product.stock;
          if (maxStock <= 0) return [];
          return [{
            ...item,
            slug: product.slug,
            name: product.name,
            brand: product.brand,
            image: product.images[0] ?? "",
            price: variant?.price ?? product.price,
            variantId: variant?.id ?? item.variantId,
            quantity: Math.min(item.quantity, maxStock),
            maxStock,
          }];
        });
        if (JSON.stringify(nextItems) !== JSON.stringify(store.items)) {
          setStore({ items: nextItems });
        }
      })
      .catch(() => {
        // The provisional local cart remains usable when the catalog is offline.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openCart = useCallback(() => setStore({ isOpen: true }), []);
  const closeCart = useCallback(() => setStore({ isOpen: false }), []);
  const toggleCart = useCallback(
    () => setStore({ isOpen: !store.isOpen }),
    [],
  );

  const addItem = useCallback((input: AddItemInput) => {
    const qty = input.quantity ?? 1;
    const key = cartLineKey(input);
    const prev = store.items;
    const existing = prev.find((i) => cartLineKey(i) === key);
    const items = existing
      ? prev.map((i) =>
          cartLineKey(i) === key
            ? {
                ...i,
                quantity: Math.min(i.maxStock, i.quantity + qty),
              }
            : i,
        )
      : [
          ...prev,
          {
            ...input,
            quantity: Math.min(input.maxStock, qty),
          },
        ];
    setStore({ items, isOpen: true });
  }, []);

  const removeItem = useCallback((line: CartLineRef) => {
    const key = cartLineKey(line);
    setStore({ items: store.items.filter((i) => cartLineKey(i) !== key) });
  }, []);

  const setQuantity = useCallback((line: CartLineRef, quantity: number) => {
    const key = cartLineKey(line);
    const items =
      quantity <= 0
        ? store.items.filter((i) => cartLineKey(i) !== key)
        : store.items.map((i) =>
            cartLineKey(i) === key
              ? { ...i, quantity: Math.min(i.maxStock, quantity) }
              : i,
          );
    setStore({ items });
  }, []);

  const replaceItems = useCallback((items: CartItem[]) => setStore({ items }), []);

  const clearCart = useCallback(() => setStore({ items: [] }), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items: snapshot.items,
      itemCount: calcItemCount(snapshot.items),
      subtotal: calcSubtotal(snapshot.items),
      isOpen: snapshot.isOpen,
      openCart,
      closeCart,
      toggleCart,
      addItem,
      removeItem,
      setQuantity,
      replaceItems,
      clearCart,
    }),
    [
      snapshot.items,
      snapshot.isOpen,
      openCart,
      closeCart,
      toggleCart,
      addItem,
      removeItem,
      setQuantity,
      replaceItems,
      clearCart,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
