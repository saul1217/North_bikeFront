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
