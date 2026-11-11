import { apiRequest } from "./client";
import type {
  AdminEcommerceSummaryQuery,
  AdminManualProduct,
  AdminManualProductsQuery,
  AdminProductListResponse,
  AdminSyncedProduct,
  AdminSyncedProductsQuery,
  ManualProductInput,
} from "./admin-types";
import type { AdminOrder, AdminOrderListResponse, AdminSummaryResponse, EcommerceFulfillmentStatus } from "./types";

export function adminHeaders(): Record<string, string> {
  const token = sessionStorage.getItem("northbike-admin-token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function toQuery(query: Record<string, unknown>) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== "") params.set(key, String(value));
  });
  return params;
}

export function fetchAdminOrders(query: AdminEcommerceSummaryQuery) {
  return apiRequest<AdminOrderListResponse>(`/admin/ecommerce/orders?${toQuery(query)}`, {
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
  return apiRequest<AdminSummaryResponse>(`/admin/ecommerce/summary?${toQuery(query)}`, {
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

// Productos del POS (sincronizados): solo se publica o retira de la tienda.

export function fetchAdminSyncedProducts(query: AdminSyncedProductsQuery) {
  return apiRequest<AdminProductListResponse<AdminSyncedProduct>>(`/admin/ecommerce/products?${toQuery(query)}`, {
    headers: adminHeaders(),
    cache: "no-store",
  });
}

export function setAdminProductOnline(id: string, onlineEnabled: boolean) {
  return apiRequest<AdminSyncedProduct>(`/admin/ecommerce/products/${encodeURIComponent(id)}/online`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...adminHeaders() },
    body: JSON.stringify({ onlineEnabled }),
  });
}

// Productos manuales (online_products): solo existen en la tienda en línea.

export function fetchAdminManualProducts(query: AdminManualProductsQuery) {
  return apiRequest<AdminProductListResponse<AdminManualProduct>>(`/admin/ecommerce/manual-products?${toQuery(query)}`, {
    headers: adminHeaders(),
    cache: "no-store",
  });
}

export function fetchAdminManualProduct(id: string) {
  return apiRequest<AdminManualProduct>(`/admin/ecommerce/manual-products/${encodeURIComponent(id)}`, {
    headers: adminHeaders(),
    cache: "no-store",
  });
}

export function createAdminManualProduct(input: ManualProductInput) {
  return apiRequest<AdminManualProduct>("/admin/ecommerce/manual-products", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...adminHeaders() },
    body: JSON.stringify(input),
  });
}

export function updateAdminManualProduct(id: string, patch: ManualProductInput) {
  return apiRequest<AdminManualProduct>(`/admin/ecommerce/manual-products/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...adminHeaders() },
    body: JSON.stringify(patch),
  });
}

export function setAdminManualProductPublished(id: string, published: boolean) {
  return apiRequest<AdminManualProduct>(`/admin/ecommerce/manual-products/${encodeURIComponent(id)}/published`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...adminHeaders() },
    body: JSON.stringify({ published }),
  });
}

export function deleteAdminManualProduct(id: string) {
  return apiRequest<{ id: string; deleted: boolean }>(`/admin/ecommerce/manual-products/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: adminHeaders(),
  });
}

/** Ruta de subida existente (la misma que usa el POS): Supabase Storage del backend. */
export function uploadAdminProductImage(file: File) {
  const body = new FormData();
  body.append("file", file);
  return apiRequest<{ bucket: string; path: string; url: string }>("/uploads/product-image", {
    method: "POST",
    headers: adminHeaders(),
    body,
  });
}
