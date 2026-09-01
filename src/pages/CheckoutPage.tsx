import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, CreditCard, MapPin, Store, Truck } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { cancelOrder, createCheckoutSession } from "@/lib/api/checkout";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/catalog/filters";
import { ApiRequestError } from "@/lib/api/types";
import { Button } from "@/components/ui/Button";

type FulfillmentMethod = "pickup" | "shipping";
type Address = { line1: string; line2: string; city: string; state: string; postalCode: string };
type FieldName = "name" | "email" | "phone" | keyof Address;
type FieldErrors = Partial<Record<FieldName, string>>;

const initialAddress: Address = { line1: "", line2: "", city: "", state: "", postalCode: "" };
const allowedPhone = /^\+?[0-9\s().-]+$/;
const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCheckout(name: string, email: string, phone: string, method: FulfillmentMethod, address: Address): FieldErrors {
  const errors: FieldErrors = {};
  const normalizedName = name.trim();
  const normalizedEmail = email.trim();
  const normalizedPhone = phone.trim();
  const phoneDigits = phone.replace(/\D/g, "");

  if (normalizedName.length < 2 || normalizedName.length > 120) errors.name = "Escribe tu nombre completo (entre 2 y 120 caracteres).";
  if (!validEmail.test(normalizedEmail) || normalizedEmail.length > 254) errors.email = "Escribe un correo electrónico válido.";
  if (!allowedPhone.test(normalizedPhone) || phoneDigits.length < 7 || phoneDigits.length > 15) errors.phone = "Escribe un teléfono válido de entre 7 y 15 dígitos.";

  if (method === "shipping") {
    if (address.line1.trim().length < 2 || address.line1.trim().length > 160) errors.line1 = "Escribe la calle y el número.";
    if (address.city.trim().length < 2 || address.city.trim().length > 100) errors.city = "Escribe una ciudad válida.";
    if (address.state.trim().length < 2 || address.state.trim().length > 100) errors.state = "Escribe un estado válido.";
    if (address.postalCode.trim().length < 5 || address.postalCode.trim().length > 12) errors.postalCode = "Escribe un código postal válido.";
    if (address.line2.trim().length > 160) errors.line2 = "La referencia es demasiado larga.";
  }
  return errors;
}

function apiErrorMessage(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.status === 409) return "El inventario cambió mientras preparabas tu pedido. Actualiza el catálogo e inténtalo de nuevo.";
    if (error.status === 400) return error.message || "Revisa los datos del checkout e inténtalo de nuevo.";
    if (error.status === 500) return "No pudimos iniciar el pago. Inténtalo de nuevo en unos segundos.";
  }
  return error instanceof Error ? error.message : "No se pudo iniciar el checkout.";
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <p id={`${id}-error`} className="mt-1 text-xs font-normal text-red-700" role="alert">{message}</p> : null;
}

export default function CheckoutPage() {
  const { items, subtotal } = useCart();
  const [searchParams] = useSearchParams();
  const canceled = searchParams.get("canceled") === "1";
  const canceledOrderId = searchParams.get("order_id");
  const canceledToken = searchParams.get("token");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<FulfillmentMethod>("pickup");
  const [address, setAddress] = useState<Address>(initialAddress);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fieldRefs = useRef<Partial<Record<FieldName, HTMLInputElement>>>({});

  useEffect(() => {
    if (!canceled || !canceledOrderId || !canceledToken) return;
    void cancelOrder(canceledOrderId, canceledToken).catch(() => undefined);
  }, [canceled, canceledOrderId, canceledToken]);

  const firstError = useMemo(() => Object.keys(fieldErrors)[0] as FieldName | undefined, [fieldErrors]);

  function updateAddress(field: keyof Address, value: string) {
    setAddress((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  function clearFieldError(field: FieldName) {
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (items.length === 0 || isSubmitting) return;
    const errors = validateCheckout(name, email, phone, method, address);
    setFieldErrors(errors);
    setError(null);
    const first = Object.keys(errors)[0] as FieldName | undefined;
    if (first) {
      window.requestAnimationFrame(() => fieldRefs.current[first]?.focus());
      return;
    }

    setIsSubmitting(true);
    try {
      const session = await createCheckoutSession({
        items: items.map((item) => ({ productId: item.productId, variantId: item.variantId, quantity: item.quantity })),
        customer: { name: name.trim(), email: email.trim(), phone: phone.trim() },
        fulfillment: { method, ...(method === "shipping" ? { address: { ...address, country: "MX" } } : {}) },
      });
      window.location.assign(session.checkoutUrl);
    } catch (submitError) {
      setError(apiErrorMessage(submitError));
      setIsSubmitting(false);
    }
  }

  if (items.length === 0) {
    return <div className="container-page py-20"><div className="mx-auto max-w-xl border border-north-border bg-white p-10 text-center"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-north-steel">Checkout</p><h1 className="mt-3 font-display text-4xl font-bold uppercase text-north-dark">Tu carrito está vacío</h1><p className="mx-auto mt-4 max-w-md text-north-muted">Agrega una pieza al carrito para comenzar tu compra.</p><Button className="mt-7" href="/products">Volver al catálogo</Button></div></div>;
  }

  const inputClass = (field: FieldName) => `mt-2 h-11 w-full border bg-north-background px-3 font-normal outline-none transition focus:border-north-primary focus:ring-2 focus:ring-north-primary/10 ${fieldErrors[field] ? "border-red-500" : "border-north-border"}`;
  const describedBy = (field: FieldName) => fieldErrors[field] ? `${field}-error` : undefined;

  return (
    <div className="container-page py-8 md:py-12">
      <Link to="/products" className="inline-flex items-center gap-2 text-sm font-semibold text-north-primary hover:text-north-dark"><ArrowLeft className="h-4 w-4" /> Seguir comprando</Link>
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-10">
        <form onSubmit={handleSubmit} noValidate className="space-y-8" aria-describedby={firstError ? `${firstError}-error` : undefined}>
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-north-steel">North Bike · Compra segura</p><h1 className="mt-2 font-display text-4xl font-bold uppercase tracking-[0.03em] text-north-dark md:text-5xl">Prepara tu rodada</h1><p className="mt-3 max-w-2xl text-base leading-relaxed text-north-muted">Completa tus datos. El pago se procesa en Stripe y nunca almacenamos los datos de tu tarjeta.</p></div>
          <section className="border border-north-border bg-white p-5 md:p-7"><div className="flex items-start gap-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center bg-north-dark font-display text-lg font-bold text-white">01</span><div className="flex-1"><h2 className="font-display text-2xl font-bold uppercase tracking-[0.06em]">Tus datos</h2><p className="mt-1 text-sm text-north-muted">Compra como invitado; usaremos estos datos para confirmar tu pedido.</p><div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-north-dark md:col-span-2" htmlFor="checkout-name">Nombre completo<input id="checkout-name" ref={(element) => { if (element) fieldRefs.current.name = element; }} value={name} onChange={(e) => { setName(e.target.value); clearFieldError("name"); }} className={inputClass("name")} aria-invalid={Boolean(fieldErrors.name)} aria-describedby={describedBy("name")} autoComplete="name" /> <FieldError id="name" message={fieldErrors.name} /></label>
            <label className="text-sm font-semibold text-north-dark" htmlFor="checkout-email">Correo electrónico<input id="checkout-email" ref={(element) => { if (element) fieldRefs.current.email = element; }} type="email" value={email} onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }} className={inputClass("email")} aria-invalid={Boolean(fieldErrors.email)} aria-describedby={describedBy("email")} autoComplete="email" /> <FieldError id="email" message={fieldErrors.email} /></label>
            <label className="text-sm font-semibold text-north-dark" htmlFor="checkout-phone">Teléfono<input id="checkout-phone" ref={(element) => { if (element) fieldRefs.current.phone = element; }} type="tel" inputMode="tel" maxLength={30} value={phone} onChange={(e) => { setPhone(e.target.value); clearFieldError("phone"); }} placeholder="+52 614 123 4567" className={inputClass("phone")} aria-invalid={Boolean(fieldErrors.phone)} aria-describedby={describedBy("phone")} autoComplete="tel" /> <FieldError id="phone" message={fieldErrors.phone} /></label>
          </div></div></div></section>
          <section className="border border-north-border bg-white p-5 md:p-7"><div className="flex items-start gap-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center bg-north-dark font-display text-lg font-bold text-white">02</span><div className="flex-1"><h2 className="font-display text-2xl font-bold uppercase tracking-[0.06em]">Cómo recibirlo</h2><div className="mt-5 grid gap-3 md:grid-cols-2">
            <label className={`cursor-pointer border p-4 transition ${method === "pickup" ? "border-north-primary bg-north-background" : "border-north-border"}`}><input type="radio" name="fulfillment" value="pickup" checked={method === "pickup"} onChange={() => { setMethod("pickup"); setFieldErrors({}); }} className="sr-only" /><span className="flex items-center gap-3"><Store className="h-5 w-5 text-north-primary" /><span><strong className="block text-sm">Recoger en tienda</strong><span className="text-xs text-north-muted">Te avisaremos cuando esté listo.</span></span>{method === "pickup" && <Check className="ml-auto h-4 w-4 text-north-primary" />}</span></label>
            <label className={`cursor-pointer border p-4 transition ${method === "shipping" ? "border-north-primary bg-north-background" : "border-north-border"}`}><input type="radio" name="fulfillment" value="shipping" checked={method === "shipping"} onChange={() => setMethod("shipping")} className="sr-only" /><span className="flex items-center gap-3"><Truck className="h-5 w-5 text-north-primary" /><span><strong className="block text-sm">Envío a domicilio</strong><span className="text-xs text-north-muted">Envío sin costo durante esta prueba.</span></span>{method === "shipping" && <Check className="ml-auto h-4 w-4 text-north-primary" />}</span></label>
          </div>
          {method === "shipping" && <div className="mt-5 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold md:col-span-2" htmlFor="checkout-line1">Calle y número<input id="checkout-line1" ref={(element) => { if (element) fieldRefs.current.line1 = element; }} value={address.line1} onChange={(e) => updateAddress("line1", e.target.value)} className={inputClass("line1")} aria-invalid={Boolean(fieldErrors.line1)} aria-describedby={describedBy("line1")} autoComplete="street-address" /> <FieldError id="line1" message={fieldErrors.line1} /></label>
            <label className="text-sm font-semibold md:col-span-2" htmlFor="checkout-line2">Interior o referencia <span className="font-normal text-north-muted">(opcional)</span><input id="checkout-line2" ref={(element) => { if (element) fieldRefs.current.line2 = element; }} value={address.line2} onChange={(e) => updateAddress("line2", e.target.value)} className={inputClass("line2")} aria-invalid={Boolean(fieldErrors.line2)} aria-describedby={describedBy("line2")} /> <FieldError id="line2" message={fieldErrors.line2} /></label>
            <label className="text-sm font-semibold" htmlFor="checkout-city">Ciudad<input id="checkout-city" ref={(element) => { if (element) fieldRefs.current.city = element; }} value={address.city} onChange={(e) => updateAddress("city", e.target.value)} className={inputClass("city")} aria-invalid={Boolean(fieldErrors.city)} aria-describedby={describedBy("city")} autoComplete="address-level2" /> <FieldError id="city" message={fieldErrors.city} /></label>
            <label className="text-sm font-semibold" htmlFor="checkout-state">Estado<input id="checkout-state" ref={(element) => { if (element) fieldRefs.current.state = element; }} value={address.state} onChange={(e) => updateAddress("state", e.target.value)} className={inputClass("state")} aria-invalid={Boolean(fieldErrors.state)} aria-describedby={describedBy("state")} autoComplete="address-level1" /> <FieldError id="state" message={fieldErrors.state} /></label>
            <label className="text-sm font-semibold" htmlFor="checkout-postalCode">Código postal<input id="checkout-postalCode" ref={(element) => { if (element) fieldRefs.current.postalCode = element; }} value={address.postalCode} onChange={(e) => updateAddress("postalCode", e.target.value)} className={inputClass("postalCode")} aria-invalid={Boolean(fieldErrors.postalCode)} aria-describedby={describedBy("postalCode")} autoComplete="postal-code" /> <FieldError id="postalCode" message={fieldErrors.postalCode} /></label>
          </div>}
          </div></div></section>
          {error && <div role="alert" className="border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="flex items-center gap-2 text-xs text-north-muted"><CreditCard className="h-4 w-4" /> Pago seguro · entorno de pruebas</p><Button type="submit" size="lg" disabled={isSubmitting}>{isSubmitting ? "Preparando pago…" : <>Continuar al pago <ArrowRight className="h-4 w-4" /></>}</Button></div>
        </form>
        <aside className="border border-north-border bg-white lg:sticky lg:top-28"><div className="surface-dark-texture bg-north-dark px-5 py-5 text-white"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-north-steel-muted">Resumen</p><h2 className="mt-1 font-display text-2xl font-bold uppercase tracking-[0.06em]">Tu pedido</h2></div><ul className="divide-y divide-north-border px-5">{items.map((item) => <li key={`${item.productId}-${item.variantId ?? item.variantLabel ?? "default"}`} className="flex gap-3 py-4"><div className="flex h-16 w-14 shrink-0 items-center justify-center overflow-hidden bg-north-background">{item.image ? <img src={item.image} alt="" className="h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = "none"; }} /> : <span className="text-[10px] text-north-steel">Sin imagen</span>}</div><div className="min-w-0 flex-1"><p className="line-clamp-2 text-sm font-semibold text-north-dark">{item.name}</p>{item.variantLabel && <p className="mt-1 text-xs text-north-muted">{item.variantLabel}</p>}<p className="mt-1 text-xs text-north-muted">{item.quantity} × {formatPrice(item.price)}</p></div><p className="text-sm font-semibold text-north-dark">{formatPrice(item.price * item.quantity)}</p></li>)}</ul><div className="space-y-3 border-t border-north-border bg-north-background px-5 py-5 text-sm"><div className="flex justify-between text-north-muted"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div><div className="flex justify-between text-north-muted"><span>Envío</span><span>Gratis</span></div><div className="flex justify-between border-t border-north-border pt-3 font-display text-xl font-bold text-north-dark"><span>Total</span><span>{formatPrice(subtotal)}</span></div><p className="flex items-start gap-2 pt-2 text-xs leading-relaxed text-north-muted"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-north-primary" /> Tu inventario se reserva temporalmente al iniciar el pago.</p></div></aside>
      </div>
    </div>
  );
}
