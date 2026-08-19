import Image from "next/image";
import { Button } from "@/components/ui/Button";

export function EditorialBlock() {
  return (
    <section className="relative overflow-hidden bg-north-dark text-white">
      <div className="grid lg:grid-cols-2">
        <div className="relative min-h-[22rem] lg:min-h-[32rem]">
          <Image
            src="https://images.unsplash.com/photo-1475669698642-b7aed9b2e6b0?auto=format&fit=crop&w=1600&q=80"
            alt="Ruta de montaña"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
        <div className="surface-dark-texture flex flex-col justify-center px-6 py-14 md:px-12 lg:px-16">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-north-steel">
            Cultura MTB
          </p>
          <h2 className="max-w-md font-display text-3xl font-bold uppercase leading-tight tracking-[0.04em] md:text-5xl">
            Terreno del norte. Decisiones técnicas.
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/80">
            Polvo, altitud y trail técnico. En North Bike armamos bicicletas y
            componentes pensando en cómo se pedalea aquí: talla correcta,
            transmisión adecuada y protección que aguanta.
          </p>
          <div className="mt-8">
            <Button href="/products?category=bicicletas&bikeType=mtb" variant="dark">
              Explorar MTB
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
