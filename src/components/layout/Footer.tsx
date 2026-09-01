import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { categories } from "@/lib/data/categories";

export function Footer() {
  return (
    <footer className="mt-auto bg-north-dark text-white">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <BrandLogo variant="light" />
          <p className="max-w-xs text-sm leading-relaxed text-north-steel">
            Tienda especializada en bicicletas, componentes y cultura MTB en
            Chihuahua. Asesoría real, setup correcto y pasión por el trail.
          </p>
        </div>

        <div>
          <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-[0.16em] text-north-steel">
            Catálogo
          </h3>
          <ul className="space-y-2 text-sm">
            {categories.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={cat.href}
                  className="text-white/85 transition hover:text-white"
                >
                  {cat.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/products?category=herramientas"
                className="text-white/85 transition hover:text-white"
              >
                Herramientas
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-[0.16em] text-north-steel">
            Tienda
          </h3>
          <ul className="space-y-2 text-sm text-white/85">
            <li>Chihuahua, México</li>
            <li>
              <a href="mailto:hola@northbike.mx" className="hover:text-white">
                hola@northbike.mx
              </a>
            </li>
            <li>Lun–Sáb · horario de tienda</li>
            <li>
              <Link href="/products" className="hover:text-white">
                Ver catálogo
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 font-display text-sm font-bold uppercase tracking-[0.16em] text-north-steel">
            Servicio
          </h3>
          <ul className="space-y-2 text-sm text-white/85">
            <li>Asesoría de talla y compatibilidad</li>
            <li>Mantenimiento y ajustes</li>
            <li>Setup de componentes</li>
            <li className="pt-2 text-north-steel">
              Carrito local provisional — sin checkout real
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-north-steel sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} North Bike. Chihuahua, México.</p>
          <p>Ciclismo · Montaña · Rendimiento</p>
        </div>
      </div>
    </footer>
  );
}
