import { useParams } from "react-router-dom";
import { ProductDetail } from "@/components/product/ProductDetail";
import {
  getProductBySlug,
  getRelatedProducts,
} from "@/lib/catalog/filters";
import NotFound from "@/pages/NotFound";

export default function ProductDetailPage() {
  const { slug } = useParams();
  const product = slug ? getProductBySlug(slug) : undefined;

  if (!product) return <NotFound />;

  const related = getRelatedProducts(product, 4);
  return <ProductDetail product={product} related={related} />;
}
