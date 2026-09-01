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
  loadCart,
  saveCart,
  type CartItem,
} from "@/lib/cart/storage";
import { loadProducts } from "@/lib/catalog/useProducts";

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
  removeItem: (productId: string, variantLabel?: string, variantId?: string) => void;
  setQuantity: (
    productId: string,
    quantity: number,
    variantLabel?: string,
    variantId?: string,
  ) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function itemKey(productId: string, variantId?: string, variantLabel?: string) {
  return `${productId}::${variantId ?? variantLabel ?? ""}`;
}

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
    loadProducts()
      .then((products) => {
        if (cancelled || store.items.length === 0) return;
        const byId = new Map(products.map((product) => [product.id, product]));
        const nextItems = store.items.flatMap((item) => {
          const product = byId.get(item.productId);
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
    const key = itemKey(input.productId, input.variantId, input.variantLabel);
    const prev = store.items;
    const existing = prev.find(
      (i) => itemKey(i.productId, i.variantId, i.variantLabel) === key,
    );
    const items = existing
      ? prev.map((i) =>
          itemKey(i.productId, i.variantId, i.variantLabel) === key
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

  const removeItem = useCallback((productId: string, variantLabel?: string, variantId?: string) => {
    const key = itemKey(productId, variantId, variantLabel);
    setStore({
      items: store.items.filter(
        (i) => itemKey(i.productId, i.variantId, i.variantLabel) !== key,
      ),
    });
  }, []);

  const setQuantity = useCallback(
    (productId: string, quantity: number, variantLabel?: string, variantId?: string) => {
      const key = itemKey(productId, variantId, variantLabel);
      const items =
        quantity <= 0
          ? store.items.filter(
              (i) => itemKey(i.productId, i.variantId, i.variantLabel) !== key,
            )
          : store.items.map((i) =>
              itemKey(i.productId, i.variantId, i.variantLabel) === key
                ? { ...i, quantity: Math.min(i.maxStock, quantity) }
                : i,
            );
      setStore({ items });
    },
    [],
  );

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
