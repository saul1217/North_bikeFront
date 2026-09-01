import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { fetchOrderStatus } from "@/lib/api/checkout";
import type { OrderStatusResponse } from "@/lib/api/types";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/catalog/filters";
import { Button } from "@/components/ui/Button";

export default function CheckoutSuccessPage() {
  const [params] = useSearchParams();
  const { clearCart } = useCart();
  const [order, setOrder] = useState<OrderStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  const orderId = params.get("order_id") ?? "";
  const token = params.get("token") ?? "";

  useEffect(() => {
    if (!orderId || !token) {
      setChecking(false);
      setError("No pudimos identificar tu orden.");
      return;
    }
    let active = true;
    let timer: number | undefined;
    let attempts = 0;
    const check = async () => {
      try {
        const next = await fetchOrderStatus(orderId, token);
        if (!active) return;
        setOrder(next);
        setChecking(false);
        if (next.status === "paid") {
          clearCart();
          return;
        }
        if (["expired", "cancelled", "payment_failed", "payment_review"].includes(next.status) || attempts >= 20) return;
        attempts += 1;
        timer = window.setTimeout(check, 1500);
      } catch (statusError) {
        if (!active) return;
        setChecking(false);
        setError(statusError instanceof Error ? statusError.message : "No pudimos consultar tu orden.");
      }
    };
    void check();
    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [clearCart, orderId, token]);

  const paid = order?.status === "paid";
  const terminalFailure = order && ["expired", "cancelled", "payment_failed", "payment_review"].includes(order.status);

  return (
    <div className="container-page py-16 md:py-24">
      <div className="mx-auto max-w-2xl border border-north-border bg-white p-8 text-center md:p-12">
        {paid ? <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-700" /> : terminalFailure ? <XCircle className="mx-auto h-14 w-14 text-red-700" /> : <Clock3 className="mx-auto h-14 w-14 text-north-primary" />}
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-north-steel">North Bike · Checkout</p>
        <h1 className="mt-2 font-display text-4xl font-bold uppercase text-north-dark">{paid ? "Pago confirmado" : terminalFailure ? "Pago no confirmado" : "Confirmando tu pago"}</h1>
        <p className="mx-auto mt-4 max-w-lg leading-relaxed text-north-muted">{paid ? "Tu pedido quedó registrado. Conserva este folio para cualquier consulta." : terminalFailure ? "La reserva de inventario fue liberada. Puedes regresar al catálogo e intentarlo de nuevo." : checking ? "Stripe está confirmando el pago. Esta página se actualizará automáticamente." : error ?? "Estamos esperando la confirmación del banco."}</p>
        {order && <div className="mx-auto mt-7 max-w-sm border border-north-border bg-north-background p-5 text-left text-sm"><div className="flex justify-between"><span className="text-north-muted">Orden</span><strong className="text-north-dark">{order.id.slice(-8).toUpperCase()}</strong></div><div className="mt-2 flex justify-between"><span className="text-north-muted">Total</span><strong className="font-display text-lg text-north-dark">{formatPrice(order.total)}</strong></div><div className="mt-2 flex justify-between"><span className="text-north-muted">Entrega</span><strong className="text-north-dark">{order.fulfillmentMethod === "pickup" ? "Recoger en tienda" : "Envío a domicilio"}</strong></div></div>}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Button href="/products">Volver al catálogo</Button><Link to="/" className="inline-flex h-12 items-center justify-center px-6 text-base font-medium tracking-wide text-north-primary hover:underline">Ir al inicio</Link></div>
      </div>
    </div>
  );
}
