import { useParams } from "react-router-dom";
import { ProductDetail } from "@/components/product/ProductDetail";
import { CatalogError, CatalogLoading } from "@/components/catalog/CatalogStatus";
import { getRelatedProducts } from "@/lib/catalog/filters";
import { useProducts } from "@/lib/catalog/useProducts";
import NotFound from "@/pages/NotFound";
import { ApiRequestError } from "@/lib/api/types";

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { products, isLoading, error } = useProducts();

  if (isLoading) return <CatalogLoading />;
  if (error) return <CatalogError message={error.message} status={error instanceof ApiRequestError ? error.status : undefined} />;

  const product = products.find((item) => item.slug === slug);

  if (!product) return <NotFound />;

  const related = getRelatedProducts(products, product, 4);
  return <ProductDetail product={product} related={related} />;
}
