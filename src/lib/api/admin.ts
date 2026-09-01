import { apiRequest } from "./client";
import type { AdminEcommerceSummaryQuery } from "./admin-types";
import type { AdminOrder, AdminOrderListResponse, AdminSummaryResponse, EcommerceFulfillmentStatus } from "./types";

export function adminHeaders(): Record<string, string> {
  const token = sessionStorage.getItem("northbike-admin-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function fetchAdminOrders(query: AdminEcommerceSummaryQuery) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  return apiRequest<AdminOrderListResponse>(`/admin/ecommerce/orders?${params}`, {
    headers: adminHeaders(),
    cache: "no-store",
  });
}

export function fetchAdminOrder(id: string) {
  return apiRequest<AdminOrder>(`/admin/ecommerce/orders/${encodeURIComponent(id)}`, {
    headers: adminHeaders(),
    cache: "no-store",
  });
}

export function fetchAdminSummary(query: AdminEcommerceSummaryQuery) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  return apiRequest<AdminSummaryResponse>(`/admin/ecommerce/summary?${params}`, {
    headers: adminHeaders(),
    cache: "no-store",
  });
}

export function updateAdminFulfillment(id: string, status: EcommerceFulfillmentStatus) {
  return apiRequest<AdminOrder>(`/admin/ecommerce/orders/${encodeURIComponent(id)}/fulfillment`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...adminHeaders() },
    body: JSON.stringify({ status }),
  });
}
