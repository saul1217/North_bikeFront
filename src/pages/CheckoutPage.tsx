import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CreditCard, MapPin, Store, Truck } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { cancelOrder, createCheckoutSession } from "@/lib/api/checkout";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/catalog/filters";
import { Button } from "@/components/ui/Button";

type FulfillmentMethod = "pickup" | "shipping";

const initialAddress = {
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
};

export default function CheckoutPage() {
  const { items, subtotal } = useCart();
  const [searchParams] = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<FulfillmentMethod>("pickup");
  const [address, setAddress] = useState(initialAddress);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cancelledOrder = useMemo(
    () => ({
      id: searchParams.get("order_id"),
      token: searchParams.get("token"),
    }),
    [searchParams],
  );

  useEffect(() => {
    if (searchParams.get("canceled") !== "1" || !cancelledOrder.id || !cancelledOrder.token) return;
    void cancelOrder(cancelledOrder.id, cancelledOrder.token).catch(() => undefined);
  }, [cancelledOrder.id, cancelledOrder.token, searchParams]);

  function updateAddress(field: keyof typeof initialAddress, value: string) {
    setAddress((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (items.length === 0 || isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const session = await createCheckoutSession({
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        customer: { name, email, phone },
        fulfillment: {
          method,
          ...(method === "shipping" ? { address: { ...address, country: "MX" } } : {}),
        },
      });
      window.location.assign(session.checkoutUrl);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo iniciar el checkout.");
      setIsSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="container-page py-20">
        <div className="mx-auto max-w-xl border border-north-border bg-white p-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-north-steel">Checkout</p>
          <h1 className="mt-3 font-display text-4xl font-bold uppercase text-north-dark">Tu carrito está vacío</h1>
          <p className="mx-auto mt-4 max-w-md text-north-muted">Agrega una pieza al carrito para comenzar tu compra.</p>
          <Button className="mt-7" href="/products">Volver al catálogo</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-8 md:py-12">
      <Link to="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-north-primary hover:text-north-dark">
        <ArrowLeft className="h-4 w-4" /> Seguir comprando
      </Link>
      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-north-steel">North Bike · Compra segura</p>
            <h1 className="mt-2 font-display text-4xl font-bold uppercase tracking-[0.03em] text-north-dark md:text-5xl">Prepara tu rodada</h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-north-muted">Completa tus datos. El pago se procesa en Stripe y nunca almacenamos los datos de tu tarjeta.</p>
          </div>

          <section className="border border-north-border bg-white p-5 md:p-7">
            <div className="flex items-start gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-north-dark font-display text-lg font-bold text-white">01</span>
              <div className="flex-1">
                <h2 className="font-display text-2xl font-bold uppercase tracking-[0.06em]">Tus datos</h2>
                <p className="mt-1 text-sm text-north-muted">Compra como invitado; usaremos estos datos para confirmar tu pedido.</p>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <label className="text-sm font-semibold text-north-dark md:col-span-2">Nombre completo<input required value={name} onChange={(e) => setName(e.target.value)} className="mt-2 h-11 w-full border border-north-border bg-north-background px-3 font-normal outline-none focus:border-north-primary" autoComplete="name" /></label>
                  <label className="text-sm font-semibold text-north-dark">Correo electrónico<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 h-11 w-full border border-north-border bg-north-background px-3 font-normal outline-none focus:border-north-primary" autoComplete="email" /></label>
                  <label className="text-sm font-semibold text-north-dark">Teléfono<input required value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-2 h-11 w-full border border-north-border bg-north-background px-3 font-normal outline-none focus:border-north-primary" autoComplete="tel" /></label>
                </div>
              </div>
            </div>
          </section>

          <section className="border border-north-border bg-white p-5 md:p-7">
            <div className="flex items-start gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-north-dark font-display text-lg font-bold text-white">02</span>
              <div className="flex-1">
                <h2 className="font-display text-2xl font-bold uppercase tracking-[0.06em]">Cómo recibirlo</h2>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <label className={`cursor-pointer border p-4 transition ${method === "pickup" ? "border-north-primary bg-north-background" : "border-north-border"}`}><input type="radio" name="fulfillment" value="pickup" checked={method === "pickup"} onChange={() => setMethod("pickup")} className="sr-only" /><span className="flex items-center gap-3"><Store className="h-5 w-5 text-north-primary" /><span><strong className="block text-sm">Recoger en tienda</strong><span className="text-xs text-north-muted">Te avisaremos cuando esté listo.</span></span>{method === "pickup" && <Check className="ml-auto h-4 w-4 text-north-primary" />}</span></label>
                  <label className={`cursor-pointer border p-4 transition ${method === "shipping" ? "border-north-primary bg-north-background" : "border-north-border"}`}><input type="radio" name="fulfillment" value="shipping" checked={method === "shipping"} onChange={() => setMethod("shipping")} className="sr-only" /><span className="flex items-center gap-3"><Truck className="h-5 w-5 text-north-primary" /><span><strong className="block text-sm">Envío a domicilio</strong><span className="text-xs text-north-muted">Envío sin costo durante esta prueba.</span></span>{method === "shipping" && <Check className="ml-auto h-4 w-4 text-north-primary" />}</span></label>
                </div>
                {method === "shipping" && <div className="mt-5 grid gap-4 md:grid-cols-2"><label className="text-sm font-semibold md:col-span-2">Calle y número<input required value={address.line1} onChange={(e) => updateAddress("line1", e.target.value)} className="mt-2 h-11 w-full border border-north-border bg-north-background px-3 font-normal outline-none focus:border-north-primary" autoComplete="street-address" /></label><label className="text-sm font-semibold md:col-span-2">Interior o referencia <span className="font-normal text-north-muted">(opcional)</span><input value={address.line2} onChange={(e) => updateAddress("line2", e.target.value)} className="mt-2 h-11 w-full border border-north-border bg-north-background px-3 font-normal outline-none focus:border-north-primary" /></label><label className="text-sm font-semibold">Ciudad<input required value={address.city} onChange={(e) => updateAddress("city", e.target.value)} className="mt-2 h-11 w-full border border-north-border bg-north-background px-3 font-normal outline-none focus:border-north-primary" autoComplete="address-level2" /></label><label className="text-sm font-semibold">Estado<input required value={address.state} onChange={(e) => updateAddress("state", e.target.value)} className="mt-2 h-11 w-full border border-north-border bg-north-background px-3 font-normal outline-none focus:border-north-primary" autoComplete="address-level1" /></label><label className="text-sm font-semibold">Código postal<input required value={address.postalCode} onChange={(e) => updateAddress("postalCode", e.target.value)} className="mt-2 h-11 w-full border border-north-border bg-north-background px-3 font-normal outline-none focus:border-north-primary" autoComplete="postal-code" /></label></div>}
              </div>
            </div>
          </section>

          {error && <div role="alert" className="border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="flex items-center gap-2 text-xs text-north-muted"><CreditCard className="h-4 w-4" /> Pago seguro procesado por Stripe Test</p><Button type="submit" size="lg" disabled={isSubmitting}>{isSubmitting ? "Preparando pago…" : <>Continuar al pago <ArrowRight className="h-4 w-4" /></>}</Button></div>
        </form>

        <aside className="border border-north-border bg-white lg:sticky lg:top-28">
          <div className="surface-dark-texture bg-north-dark px-5 py-5 text-white"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-north-steel-muted">Resumen</p><h2 className="mt-1 font-display text-2xl font-bold uppercase tracking-[0.06em]">Tu pedido</h2></div>
          <ul className="divide-y divide-north-border px-5">{items.map((item) => <li key={`${item.productId}-${item.variantId ?? item.variantLabel ?? "default"}`} className="flex gap-3 py-4"><div className="flex h-16 w-14 shrink-0 items-center justify-center overflow-hidden bg-north-background">{item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" /> : <span className="text-[10px] text-north-steel">Sin imagen</span>}</div><div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-semibold text-north-dark">{item.name}</p>{item.variantLabel && <p className="mt-1 text-xs text-north-muted">{item.variantLabel}</p>}<p className="mt-1 text-xs text-north-muted">{item.quantity} × {formatPrice(item.price)}</p></div><p className="text-sm font-semibold text-north-dark">{formatPrice(item.price * item.quantity)}</p></li>)}</ul>
          <div className="space-y-3 border-t border-north-border bg-north-background px-5 py-5 text-sm"><div className="flex justify-between text-north-muted"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div><div className="flex justify-between text-north-muted"><span>Envío</span><span>Gratis</span></div><div className="flex justify-between border-t border-north-border pt-3 font-display text-xl font-bold text-north-dark"><span>Total</span><span>{formatPrice(subtotal)}</span></div><p className="flex items-start gap-2 pt-2 text-xs leading-relaxed text-north-muted"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-north-primary" /> Tu inventario se reserva temporalmente al iniciar el pago.</p></div>
        </aside>
      </div>
    </div>
  );
}
