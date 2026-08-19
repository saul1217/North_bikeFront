export type ProductCategory =
  | "bicicletas"
  | "componentes"
  | "proteccion"
  | "accesorios"
  | "ropa"
  | "llantas"
  | "herramientas";

export type BikeType = "mtb" | "gravel" | "road" | "urban";

export type VariantType = "size" | "color";

export type ProductVariant = {
  id: string;
  label: string;
  type: VariantType;
  value: string;
  stock?: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: ProductCategory;
  subcategory?: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  description: string;
  features: string[];
  specifications: Record<string, string>;
  variants: ProductVariant[];
  stock: number;
  featured: boolean;
  isNew?: boolean;
  bikeType?: BikeType;
  sizes?: string[];
  compatibility?: string;
};

export type CategoryMeta = {
  id: ProductCategory;
  label: string;
  href: string;
  description: string;
  image: string;
};

export type BrandMeta = {
  id: string;
  name: string;
};
