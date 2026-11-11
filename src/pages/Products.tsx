import { CatalogView } from "@/components/catalog/CatalogView";
import { CatalogEmpty, CatalogError, CatalogLoading, CatalogPartialNotice } from "@/components/catalog/CatalogStatus";
import { useProducts } from "@/lib/catalog/useProducts";
import { ApiRequestError } from "@/lib/api/types";

export default function Products() {
  const { products, failedSources, isLoading, error } = useProducts();
  if (isLoading) return <CatalogLoading />;
  if (error) return <CatalogError message={error.message} status={error instanceof ApiRequestError ? error.status : undefined} />;
  if (products.length === 0 && failedSources.length > 0) {
    return <CatalogError message="Una de las fuentes del catálogo no respondió y la otra no tiene productos publicados." />;
  }
  if (products.length === 0) return <CatalogEmpty />;
  return (
    <>
      <CatalogPartialNotice failedSources={failedSources} />
      <CatalogView products={products} />
    </>
  );
}
