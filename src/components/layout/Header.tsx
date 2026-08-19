"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Search, ShoppingBag, X } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useCart } from "@/context/CartContext";

const navLinks = [
  { label: "Bicicletas", href: "/products?category=bicicletas" },
  { label: "Componentes", href: "/products?category=componentes" },
  { label: "Accesorios", href: "/products?category=accesorios" },
  { label: "Protección", href: "/products?category=proteccion" },
  { label: "Marcas", href: "/products#marcas" },
  { label: "Ofertas", href: "/products?sort=featured" },
];

export function Header() {
  const pathname = usePathname();
  return <HeaderInner key={pathname} />;
}

function HeaderInner() {
  const router = useRouter();
  const { itemCount, openCart } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
    setSearchOpen(false);
    setMobileOpen(false);
  }

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-colors ${
        scrolled
          ? "border-north-border bg-white/95 backdrop-blur-sm"
          : "border-transparent bg-white"
      }`}
    >
      <div className="bg-north-dark text-white">
        <div className="container-page flex h-8 items-center justify-between text-[11px] tracking-wide">
          <p className="truncate">
            Tienda especializada en ciclismo · Chihuahua, México
          </p>
          <p className="hidden text-north-steel sm:block">
            Asesoría técnica en tienda
          </p>
        </div>
      </div>

      <div className="container-page">
        <div className="flex h-16 items-center gap-3 md:h-[4.25rem] md:gap-6">
          <button
            type="button"
            className="p-2 text-north-dark lg:hidden"
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <BrandLogo className="mr-auto lg:mr-0" />

          <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-2.5 py-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-north-dark transition hover:text-north-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-2 text-north-dark hover:text-north-primary"
              aria-label="Buscar"
              onClick={() => setSearchOpen((v) => !v)}
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="relative p-2 text-north-dark hover:text-north-primary"
              aria-label="Abrir carrito"
              onClick={openCart}
            >
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center bg-north-primary px-1 text-[10px] font-bold text-white">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {searchOpen && (
          <form
            onSubmit={submitSearch}
            className="border-t border-north-border py-3"
          >
            <label className="sr-only" htmlFor="header-search">
              Buscar productos
            </label>
            <div className="flex gap-2">
              <input
                id="header-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar bicicletas, cascos, componentes…"
                className="h-11 w-full border border-north-border bg-north-background px-3 text-sm outline-none focus:border-north-primary"
                autoFocus
              />
              <button
                type="submit"
                className="h-11 bg-north-primary px-4 text-sm font-semibold text-white hover:bg-north-primary-hover"
              >
                Buscar
              </button>
            </div>
          </form>
        )}
      </div>

      <div
        className={`fixed inset-0 top-[calc(2rem+4rem)] z-30 lg:hidden ${
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          className={`absolute inset-0 bg-north-dark/40 transition-opacity ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={`absolute inset-y-0 left-0 flex w-[min(100%,20rem)] flex-col bg-white shadow-xl transition-transform duration-300 ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <nav className="flex flex-col gap-1 p-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="border-b border-north-border px-1 py-3 font-display text-lg font-semibold uppercase tracking-[0.08em] text-north-dark"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/products"
              className="mt-2 px-1 py-3 text-sm font-semibold text-north-primary"
              onClick={() => setMobileOpen(false)}
            >
              Ver todo el catálogo
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
