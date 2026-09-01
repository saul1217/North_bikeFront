import { HomeHero } from "@/components/home/HomeHero";
import { CategoryEntry } from "@/components/home/CategoryEntry";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { EditorialBlock } from "@/components/home/EditorialBlock";
import { CollectionStrip } from "@/components/home/CollectionStrip";
import { BrandsBand } from "@/components/home/BrandsBand";
import { AdviceCTA } from "@/components/home/AdviceCTA";
import { CatalogEmpty, CatalogError, CatalogLoading } from "@/components/catalog/CatalogStatus";
import { filterProducts, getUniqueBrands } from "@/lib/catalog/filters";
import { useProducts } from "@/lib/catalog/useProducts";
import { ApiRequestError } from "@/lib/api/types";

export default function Home() {
  const { products, isLoading, error } = useProducts();

  if (isLoading) return <CatalogLoading />;
  if (error) return <><HomeHero /><CatalogError message={error.message} status={error instanceof ApiRequestError ? error.status : undefined} /></>;
  if (products.length === 0) return <><HomeHero /><CatalogEmpty /></>;

  const featured = products.slice(0, 8);
  const protection = filterProducts(products, {
    category: "proteccion",
    sort: "price-asc",
  }).slice(0, 4);

  return (
    <>
      <HomeHero />
      <CategoryEntry />
      <FeaturedProducts products={featured} />
      <EditorialBlock />
      <CollectionStrip
        title="Protección que pedalea"
        subtitle="Cascos y equipo"
        href="/products?category=proteccion"
        products={protection}
      />
      <BrandsBand brands={getUniqueBrands(products)} />
      <AdviceCTA />
    </>
  );
}
