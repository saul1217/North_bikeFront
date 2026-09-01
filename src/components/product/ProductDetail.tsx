"use client";

import Image from "next/image";
import { useState } from "react";
import type { Product } from "@/lib/types/product";
import { useCart } from "@/context/CartContext";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Badge } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Price";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/catalog/ProductCard";
import { categoryLabels } from "@/lib/data/categories";
import { refreshProduct } from "@/lib/catalog/useProducts";

export function ProductDetail({
  product,
  related,
}: {
  product: Product;
  related: Product[];
}) {
  const { addItem } = useCart();
  const [activeImage, setActiveImage] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const sizeVariants = product.variants.filter((v) => v.type === "size");
  const colorVariants = product.variants.filter((v) => v.type === "color");

  const [size, setSize] = useState(sizeVariants[0]?.value ?? "");
  const [color, setColor] = useState(colorVariants[0]?.value ?? "");

  const selectedSize = sizeVariants.find((v) => v.value === size);
  const selectedColor = colorVariants.find((v) => v.value === color);

  const maxStock = selectedSize?.stock ?? selectedColor?.stock ?? product.stock;
  const selectedPrice = selectedSize?.price ?? selectedColor?.price ?? product.price;
  const inStock = maxStock > 0;
  const onSale = Boolean(
    product.compareAtPrice && product.compareAtPrice > product.price,
  );

  const variantLabel = [selectedSize?.label, selectedColor?.label]
    .filter(Boolean)
    .join(" · ");
  const selectedVariantId = selectedSize?.id ?? selectedColor?.id;

  async function handleAdd() {
    if (!inStock || isAdding) return;
    if (sizeVariants.length && !size) return;
    setIsAdding(true);
    setAddError(null);
    try {
      const liveProduct = await refreshProduct(product.id);
      if (!liveProduct) throw new Error("El producto ya no está disponible.");
      const liveVariant = liveProduct.variants.find(
        (variant) =>
          variant.id === selectedVariantId ||
          variant.label === selectedSize?.label ||
          variant.label === selectedColor?.label,
      );
      const liveStock = liveVariant?.stock ?? liveProduct.stock;
      if (liveStock <= 0) {
        setAddError("Este producto se agotó. Actualiza la página para ver el catálogo.");
        return;
      }
      if (quantity > liveStock) {
        setQuantity(liveStock);
        setAddError(`Solo quedan ${liveStock} piezas disponibles.`);
        return;
      }
      addItem({
        productId: liveProduct.id,
        slug: liveProduct.slug,
        name: liveProduct.name,
        brand: liveProduct.brand,
        image: liveProduct.images[0] ?? "",
        price: liveVariant?.price ?? liveProduct.price,
        variantId: liveVariant?.id ?? selectedVariantId,
        quantity,
        variantLabel: variantLabel || undefined,
        maxStock: liveStock,
      });
    } catch (error) {
      setAddError(error instanceof Error ? error.message : "No se pudo validar el inventario.");
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <div className="container-page py-8 md:py-12">
      <Breadcrumb
        items={[
          { label: "Inicio", href: "/" },
          { label: "Catálogo", href: "/products" },
          {
            label: categoryLabels[product.category] ?? product.category,
            href: `/products?category=${product.category}`,
          },
          { label: product.name },
        ]}
      />

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <div className="relative mb-3 aspect-[4/5] overflow-hidden bg-north-border md:aspect-square">
            {product.images[0] && !imageFailed ? (
              <Image
                src={product.images[activeImage] ?? product.images[0]}
                alt={product.name}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-north-steel">
                Imagen no disponible
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((src, index) => (
                <button
                  key={src + index}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  className={`relative aspect-square overflow-hidden border ${
                    activeImage === index
                      ? "border-north-primary"
                      : "border-transparent"
                  }`}
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="120px"
                    onError={(event) => { event.currentTarget.style.display = "none"; }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            {onSale && <Badge tone="sale">Oferta</Badge>}
            {product.isNew && <Badge>Nuevo</Badge>}
            <Badge tone="muted">{inStock ? "En stock" : "Agotado"}</Badge>
          </div>

          {product.brand && (
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-north-steel">
              {product.brand}
            </p>
          )}
          <h1 className="mt-2 font-display text-3xl font-bold uppercase leading-tight tracking-[0.03em] text-north-dark md:text-4xl">
            {product.name}
          </h1>

          <Price
            price={selectedPrice}
            compareAtPrice={product.compareAtPrice}
            size="lg"
            className="mt-4"
          />

          {product.description && (
            <p className="mt-5 max-w-xl text-base leading-relaxed text-north-muted">
              {product.description}
            </p>
          )}

          {sizeVariants.length > 0 && (
            <div className="mt-8">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-north-steel">
                Talla
              </p>
              <div className="flex flex-wrap gap-2">
                {sizeVariants.map((v) => {
                  const disabled = (v.stock ?? 0) === 0;
                  const active = size === v.value;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => setSize(v.value)}
                      className={`min-w-12 border px-3 py-2 text-sm ${
                        active
                          ? "border-north-dark bg-north-dark text-white"
                          : "border-north-border text-north-dark hover:border-north-steel"
                      } disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      {v.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {colorVariants.length > 0 && (
            <div className="mt-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-north-steel">
                Color
              </p>
              <div className="flex flex-wrap gap-2">
                {colorVariants.map((v) => {
                  const active = color === v.value;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setColor(v.value)}
                      className={`border px-3 py-2 text-sm ${
                        active
                          ? "border-north-dark bg-north-dark text-white"
                          : "border-north-border text-north-dark hover:border-north-steel"
                      }`}
                    >
                      {v.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <QuantitySelector
              value={quantity}
              max={Math.max(1, maxStock)}
              onChange={setQuantity}
            />
            <Button
              size="lg"
              className="min-w-[12rem] flex-1 sm:flex-none"
              disabled={!inStock || isAdding}
              onClick={handleAdd}
            >
              {isAdding ? "Validando…" : inStock ? "Agregar al carrito" : "Agotado"}
            </Button>
          </div>

          {addError && (
            <p className="mt-3 text-sm text-red-700" role="alert">
              {addError}
            </p>
          )}

          {product.compatibility && (
            <div className="mt-8 border border-north-border bg-north-background p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-north-steel">
                Compatibilidad
              </p>
              <p className="mt-2 text-sm leading-relaxed text-north-dark">
                {product.compatibility}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-16 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 font-display text-2xl font-bold uppercase tracking-[0.06em]">
            Descripción
          </h2>
          {product.description ? (
            <p className="text-base leading-relaxed text-north-muted">
              {product.description}
            </p>
          ) : (
            <p className="text-sm text-north-muted">
              Descripción no disponible en el catálogo.
            </p>
          )}
          {product.features.length > 0 && (
            <>
              <h3 className="mb-3 mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-north-steel">
                Características
              </h3>
              <ul className="space-y-2">
                {product.features.map((feature) => (
                  <li
                    key={feature}
                    className="border-l-2 border-north-primary pl-3 text-sm text-north-dark"
                  >
                    {feature}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {Object.keys(product.specifications).length > 0 && (
          <div>
            <h2 className="mb-4 font-display text-2xl font-bold uppercase tracking-[0.06em]">
              Especificaciones
            </h2>
            <dl className="divide-y divide-north-border border border-north-border bg-white">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div
                  key={key}
                  className="grid grid-cols-2 gap-4 px-4 py-3 text-sm"
                >
                  <dt className="font-medium text-north-muted">{key}</dt>
                  <dd className="text-north-dark">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-8 font-display text-3xl font-bold uppercase tracking-[0.04em]">
            Relacionados
          </h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-x-6">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
