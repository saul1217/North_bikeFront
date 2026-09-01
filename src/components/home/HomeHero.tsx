import Image from "next/image";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function HomeHero() {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <section className="relative isolate min-h-[78vh] overflow-hidden bg-north-dark text-white md:min-h-[78vh]">
      {/* Mobile */}
      <Image
        src="/public/images/hero-mobile.png"
        alt="Orbea MTB — North Bike Chihuahua"
        fill
        priority
        className="object-cover object-[center_40%] md:hidden"
        sizes="100vw"
        onError={() => setImageFailed(true)}
        style={imageFailed ? { display: "none" } : undefined}
      />
      {/* Desktop */}
      <Image
        src="/public/images/hero.jpg"
        alt="Línea Orbea — bicicletas en North Bike Chihuahua"
        fill
        priority
        className="hidden object-cover object-center md:block"
        sizes="100vw"
        onError={() => setImageFailed(true)}
        style={imageFailed ? { display: "none" } : undefined}
      />

      {imageFailed && <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,#1a6673_0%,#102027_42%,#071014_100%)]" aria-hidden="true" />}

      {/* Blue wash — same North Bike blue cast as the original hero */}
      <div
        className="absolute inset-0 bg-north-primary/55 mix-blend-multiply md:bg-north-primary/35"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-north-dark/85 via-north-dark/50 to-north-dark/25 md:via-north-dark/40 md:to-transparent"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-north-dark/75 via-transparent to-north-dark/35"
        aria-hidden
      />

      <div className="container-page relative flex min-h-[78vh] flex-col justify-end pb-14 pt-28 md:justify-center md:pb-16 md:pt-24">
        <p className="mb-4 font-display text-xs font-semibold uppercase tracking-[0.28em] text-north-steel md:text-sm">
          Chihuahua · Tienda especializada
        </p>
        <h1 className="max-w-xl font-display text-5xl font-bold uppercase leading-[0.92] tracking-[0.02em] md:text-7xl">
          North Bike
        </h1>
        <p className="mt-5 max-w-sm text-base leading-relaxed text-white/90 md:text-lg">
          Bicicletas, componentes y protección para riders que exigen setup
          correcto y conocimiento técnico.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button href="/products" size="lg">
            Explorar catálogo
          </Button>
          <Button
            href="/products?category=bicicletas"
            variant="outline-light"
            size="lg"
          >
            Ver bicicletas
          </Button>
        </div>
      </div>
    </section>
  );
}
