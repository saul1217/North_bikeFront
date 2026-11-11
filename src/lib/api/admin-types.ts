export type AdminEcommerceSummaryQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  paymentStatus?: string;
  fulfillmentStatus?: string;
  fulfillmentMethod?: string;
  from?: string;
  to?: string;
};

export type OnlineRisk = "serialized" | "low_stock";

/** Producto del POS en GET /api/admin/ecommerce/products. */
export type AdminSyncedProduct = {
  id: string;
  sku: string;
  name: string;
  model?: string | null;
  brand?: string | null;
  category: string;
  price: number;
  stock: number;
  image: string | null;
  status: "activo" | "inactivo" | string;
  onlineEnabled: boolean;
  hasVariants: boolean;
  variantCount: number;
  requiresSerial?: boolean;
  source?: "pos";
  syncsWithPos?: boolean;
  onlineRisks?: OnlineRisk[];
  updatedAt: string;
};

export type AdminPagination = { page: number; pageSize: number; total: number; totalPages: number };

export type AdminProductListResponse<T> = {
  items: T[];
  categories: string[];
  publishedTotal: number;
  pagination: AdminPagination;
};

export type AdminSyncedProductsQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  status?: "activo" | "inactivo" | "";
  onlineEnabled?: "true" | "false" | "";
};

/** Producto manual (tabla online_products), solo tienda en línea. */
export type AdminManualProduct = {
  id: string;
  source: "manual";
  syncsWithPos: false;
  sku: string | null;
  name: string;
  description: string | null;
  category: string;
  price: number;
  stock: number;
  image: string | null;
  images: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminManualProductsQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  category?: string;
  published?: "true" | "false" | "";
};

export type ManualProductInput = {
  name?: string;
  description?: string;
  category?: string;
  /** `null` borra el SKU en una edición (el backend no acepta texto vacío). */
  sku?: string | null;
  price?: number;
  stock?: number;
  images?: string[];
  published?: boolean;
};
