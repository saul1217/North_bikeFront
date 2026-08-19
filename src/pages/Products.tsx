import { CatalogView } from "@/components/catalog/CatalogView";
import { getAllProducts } from "@/lib/catalog/filters";

export default function Products() {
  const products = getAllProducts();
  return <CatalogView products={products} />;
}
