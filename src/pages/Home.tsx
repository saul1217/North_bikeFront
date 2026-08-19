import { HomeHero } from "@/components/home/HomeHero";
import { CategoryEntry } from "@/components/home/CategoryEntry";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { EditorialBlock } from "@/components/home/EditorialBlock";
import { CollectionStrip } from "@/components/home/CollectionStrip";
import { BrandsBand } from "@/components/home/BrandsBand";
import { AdviceCTA } from "@/components/home/AdviceCTA";
import {
  filterProducts,
  getAllProducts,
  getFeaturedProducts,
} from "@/lib/catalog/filters";

export default function Home() {
  const featured = getFeaturedProducts(8);
  const protection = filterProducts(getAllProducts(), {
    category: "proteccion",
    sort: "featured",
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
      <BrandsBand />
      <AdviceCTA />
    </>
  );
}
