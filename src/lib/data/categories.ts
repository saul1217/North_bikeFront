import type { BrandMeta, CategoryMeta } from "@/lib/types/product";

export const categories: CategoryMeta[] = [
  {
    id: "bicicletas",
    label: "Bicicletas",
    href: "/products?category=bicicletas",
    description: "MTB, gravel y ruta listas para el norte.",
    image:
      "https://images.unsplash.com/photo-1576435728678-68d0fbf3620c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "componentes",
    label: "Componentes",
    href: "/products?category=componentes",
    description: "Transmisión, frenos y upgrades de rendimiento.",
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "proteccion",
    label: "Protección",
    href: "/products?category=proteccion",
    description: "Cascos, rodilleras y equipo de impacto.",
    image:
      "https://images.unsplash.com/photo-1558618047-f4c7416b6b7b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "accesorios",
    label: "Accesorios",
    href: "/products?category=accesorios",
    description: "Luces, bidones, bolsas y setup de ruta.",
    image:
      "https://images.unsplash.com/photo-1511994298241-608b02f2308c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "ropa",
    label: "Ropa",
    href: "/products?category=ropa",
    description: "Equipamiento técnico para clima de Chihuahua.",
    image:
      "https://images.unsplash.com/photo-1517649763962-0c623066027c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "llantas",
    label: "Llantas",
    href: "/products?category=llantas",
    description: "Goma para trail, gravel y pavimento.",
    image:
      "https://images.unsplash.com/photo-1532298229143-74a630b5f0b1?auto=format&fit=crop&w=1200&q=80",
  },
];

export const brands: BrandMeta[] = [
  { id: "trek", name: "Trek" },
  { id: "specialized", name: "Specialized" },
  { id: "santa-cruz", name: "Santa Cruz" },
  { id: "shimano", name: "Shimano" },
  { id: "sram", name: "SRAM" },
  { id: "fox", name: "Fox" },
  { id: "giro", name: "Giro" },
  { id: "poc", name: "POC" },
  { id: "maxxis", name: "Maxxis" },
  { id: "park-tool", name: "Park Tool" },
  { id: "pearl-izumi", name: "Pearl Izumi" },
  { id: "topeak", name: "Topeak" },
];

export const categoryLabels: Record<string, string> = {
  bicicletas: "Bicicletas",
  componentes: "Componentes",
  proteccion: "Protección",
  accesorios: "Accesorios",
  ropa: "Ropa",
  llantas: "Llantas",
  herramientas: "Herramientas",
};

export const bikeTypeLabels: Record<string, string> = {
  mtb: "MTB",
  gravel: "Gravel",
  road: "Ruta",
  urban: "Urbana",
};
