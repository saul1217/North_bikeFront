"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/catalog/filters";
import { Button } from "@/components/ui/Button";

export function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    setQuantity,
    subtotal,
    itemCount,
  } = useCart();

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-north-dark/50 transition-opacity ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeCart}
        aria-hidden={!isOpen}
      />
      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!isOpen}
        aria-label="Carrito de compras"
      >
        <div className="flex items-center justify-between border-b border-north-border px-5 py-4">
          <div>
            <h2 className="font-display text-xl font-bold uppercase tracking-[0.08em] text-north-dark">
              Carrito
            </h2>
            <p className="text-sm text-north-muted">
              {itemCount} {itemCount === 1 ? "artículo" : "artículos"}
            </p>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="rounded-sm p-2 text-north-dark hover:bg-north-background"
            aria-label="Cerrar carrito"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <p className="font-display text-2xl font-semibold text-north-dark">
                Tu carrito está vacío
              </p>
              <p className="max-w-xs text-sm text-north-muted">
                Explora el catálogo y agrega bicicletas, componentes o
                protección.
              </p>
              <Button href="/products" onClick={closeCart}>
                Ver catálogo
              </Button>
            </div>
          ) : (
            <ul className="space-y-5">
              {items.map((item) => (
                <li
                  key={`${item.productId}-${item.variantId ?? item.variantLabel ?? "default"}`}
                  className="flex gap-3 border-b border-north-border pb-5"
                >
                  <Link
                    href={`/products/${item.slug}`}
                    onClick={closeCart}
                    className="relative h-24 w-20 shrink-0 overflow-hidden bg-north-border"
                  >
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <span className="flex h-full items-center justify-center text-center text-[10px] text-north-steel">
                        Sin imagen
                      </span>
                    )}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {item.brand && (
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-north-steel">
                            {item.brand}
                          </p>
                        )}
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={closeCart}
                          className="line-clamp-2 font-medium text-north-dark hover:text-north-primary"
                        >
                          {item.name}
                        </Link>
                        {item.variantLabel && (
                          <p className="text-xs text-north-muted">
                            {item.variantLabel}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          removeItem(item.productId, item.variantLabel, item.variantId)
                        }
                        className="p-1 text-north-muted hover:text-north-dark"
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="inline-flex h-9 items-center border border-north-border">
                        <button
                          type="button"
                          className="flex h-full w-8 items-center justify-center hover:bg-north-background"
                          onClick={() =>
                            setQuantity(
                              item.productId,
                              item.quantity - 1,
                              item.variantLabel,
                              item.variantId,
                            )
                          }
                          aria-label="Disminuir"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="min-w-8 text-center text-sm tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="flex h-full w-8 items-center justify-center hover:bg-north-background disabled:opacity-40"
                          disabled={item.quantity >= item.maxStock}
                          onClick={() =>
                            setQuantity(
                              item.productId,
                              item.quantity + 1,
                              item.variantLabel,
                              item.variantId,
                            )
                          }
                          aria-label="Aumentar"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="font-display text-base font-semibold">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-north-border bg-north-background px-5 py-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-north-muted">Subtotal</span>
              <span className="font-display text-xl font-bold tracking-wide">
                {formatPrice(subtotal)}
              </span>
            </div>
            <p className="mb-4 text-xs leading-relaxed text-north-muted">
              El checkout reservará el inventario durante el proceso de pago.
            </p>
            <Button className="w-full" size="lg" href="/checkout" onClick={closeCart}>
              Continuar al checkout
            </Button>
            <button
              type="button"
              onClick={closeCart}
              className="mt-3 w-full text-center text-sm text-north-primary hover:underline"
            >
              Seguir comprando
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
