export type ApiProductVariant = {
  id: string;
  sku: string;
  upc?: string | null;
  barcode?: string | null;
  label: string;
  price: number | string;
  stock: number;
  minStock: number;
  location?: string | null;
  size?: string | null;
  wheelSize?: string | null;
  color?: string | null;
  model?: string | null;
};

/**
 * Origen del inventario de un producto de la tienda en línea.
 * - "pos": catálogo del POS publicado con onlineEnabled (GET /api/products).
 * - "manual": producto que solo existe en la tienda (GET /api/online-products).
 * Un dato sin origen (carritos o respuestas anteriores) se trata como "pos".
 */
export type ProductSource = "pos" | "manual";

export type ApiProduct = {
  id: string;
  source?: ProductSource;
  sku: string;
  name: string;
  category: string;
  brand?: string | null;
  description?: string | null;
  features?: string[] | null;
  specifications?: Record<string, string> | null;
  compareAtPrice?: number | string | null;
  featured?: boolean;
  isNew?: boolean;
  bikeType?: string | null;
  compatibility?: string | null;
  price: number | string;
  stock: number;
  minStock: number;
  upc?: string | null;
  barcode?: string | null;
  image?: string | null;
  images?: string[];
  status: "activo" | "inactivo" | string;
  hasVariants: boolean;
  requiresSerial: boolean;
  location?: string | null;
  variants: ApiProductVariant[];
  serialUnits?: unknown[];
  createdAt?: string;
  updatedAt?: string;
};

export type ApiErrorPayload = {
  statusCode?: number;
  message?: string | string[];
  error?: string;
};

export type AuthUser = {
  id: string;
  username: string;
  role: "admin" | "cajero" | "taller" | string;
  mustChangePassword: boolean;
  email: string | null;
  emailVerified: boolean;
};

export type LoginResponse = {
  access_token: string;
  user: AuthUser;
};

export type EcommerceFulfillmentStatus =
  | "pending"
  | "preparing"
  | "ready_for_pickup"
  | "picked_up"
  | "shipped"
  | "delivered";

export type AdminOrderItem = {
  id: string;
  /** Presente con el backend de dos modos; sin dato es "pos". */
  inventorySource?: ProductSource;
  productId: string;
  variantId: string | null;
  sku: string;
  name: string;
  variantLabel: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type AdminOrder = {
  id: string;
  folio: string;
  createdAt: string;
  paidAt: string | null;
  customer: { name: string; email: string; phone: string };
  fulfillmentMethod: "pickup" | "shipping";
  fulfillmentStatus: EcommerceFulfillmentStatus;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
  } | null;
  status: string;
  paymentStatus: string;
  currency: string;
  subtotal: number;
  shippingTotal: number;
  total: number;
  reservationExpiresAt: string;
  items: AdminOrderItem[];
};

export type AdminOrderListResponse = {
  items: AdminOrder[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

export type AdminSummaryResponse = {
  from: string | null;
  to: string | null;
  currency: "mxn" | string;
  revenue: number;
  paidOrders: number;
  unitsSold: number;
  averageOrder: number;
  topProducts: Array<{
    sku: string;
    name: string;
    variantLabel: string | null;
    unitsSold: number;
    revenue: number;
  }>;
};

export type CheckoutRequestItem = {
  productId: string;
  variantId?: string;
  quantity: number;
  /** Solo se envía para productos manuales; sin dato el backend asume "pos". */
  source?: "manual";
};

export type CheckoutRequest = {
  items: CheckoutRequestItem[];
  customer: { name: string; email: string; phone: string };
  /** North Bike solo entrega en tienda: el backend rechaza "shipping" con 400 (#82). */
  fulfillment: { method: "pickup" };
};

export type CheckoutSessionResponse = {
  orderId: string;
  checkoutUrl: string;
  sessionId: string;
  publicToken: string;
  expiresAt: string;
};

export type OrderStatusResponse = {
  id: string;
  status: string;
  paymentStatus: string;
  currency: string;
  subtotal: number;
  shippingTotal: number;
  total: number;
  fulfillmentMethod: "pickup" | "shipping";
  expiresAt: string;
  items: Array<{
    id: string;
    productId: string;
    variantId: string | null;
    sku: string;
    name: string;
    variantLabel: string | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }>;
};

export type ApiErrorKind =
  | "http"
  | "network"
  | "timeout"
  | "invalid-json"
  | "invalid-response";

export class ApiRequestError extends Error {
  readonly kind: ApiErrorKind;
  readonly status?: number;

  constructor(
    message: string,
    options: { kind: ApiErrorKind; status?: number },
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.kind = options.kind;
    this.status = options.status;
  }
}
