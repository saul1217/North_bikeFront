import { apiRequest } from "./client";
import type {
  CheckoutRequest,
  CheckoutSessionResponse,
  OrderStatusResponse,
} from "./types";

export function createCheckoutSession(payload: CheckoutRequest) {
  return apiRequest<CheckoutSessionResponse>("/checkout/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function fetchOrderStatus(orderId: string, token: string) {
  return apiRequest<OrderStatusResponse>(
    `/orders/${encodeURIComponent(orderId)}/status?token=${encodeURIComponent(token)}`,
    { cache: "no-store" },
  );
}

export function cancelOrder(orderId: string, token: string) {
  return apiRequest<OrderStatusResponse>(`/orders/${encodeURIComponent(orderId)}/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
}
