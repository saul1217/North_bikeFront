"use client";

import {
  createContext,
  useCallback,
  useContext,
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
  removeItem: (productId: string, variantLabel?: string) => void;
  setQuantity: (
    productId: string,
    quantity: number,
    variantLabel?: string,
  ) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function itemKey(productId: string, variantLabel?: string) {
  return `${productId}::${variantLabel ?? ""}`;
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

  const openCart = useCallback(() => setStore({ isOpen: true }), []);
  const closeCart = useCallback(() => setStore({ isOpen: false }), []);
  const toggleCart = useCallback(
    () => setStore({ isOpen: !store.isOpen }),
    [],
  );

  const addItem = useCallback((input: AddItemInput) => {
    const qty = input.quantity ?? 1;
    const key = itemKey(input.productId, input.variantLabel);
    const prev = store.items;
    const existing = prev.find(
      (i) => itemKey(i.productId, i.variantLabel) === key,
    );
    const items = existing
      ? prev.map((i) =>
          itemKey(i.productId, i.variantLabel) === key
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

  const removeItem = useCallback((productId: string, variantLabel?: string) => {
    const key = itemKey(productId, variantLabel);
    setStore({
      items: store.items.filter(
        (i) => itemKey(i.productId, i.variantLabel) !== key,
      ),
    });
  }, []);

  const setQuantity = useCallback(
    (productId: string, quantity: number, variantLabel?: string) => {
      const key = itemKey(productId, variantLabel);
      const items =
        quantity <= 0
          ? store.items.filter(
              (i) => itemKey(i.productId, i.variantLabel) !== key,
            )
          : store.items.map((i) =>
              itemKey(i.productId, i.variantLabel) === key
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
