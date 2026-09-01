import { CatalogView } from "@/components/catalog/CatalogView";
import { CatalogEmpty, CatalogError, CatalogLoading } from "@/components/catalog/CatalogStatus";
import { useProducts } from "@/lib/catalog/useProducts";
import { ApiRequestError } from "@/lib/api/types";

export default function Products() {
  const { products, isLoading, error } = useProducts();
  if (isLoading) return <CatalogLoading />;
  if (error) return <CatalogError message={error.message} status={error instanceof ApiRequestError ? error.status : undefined} />;
  if (products.length === 0) return <CatalogEmpty />;
  return <CatalogView products={products} />;
}
