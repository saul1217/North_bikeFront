import { Button } from "@/components/ui/Button";

export function AdviceCTA() {
  return (
    <section className="container-page py-16 md:py-20">
      <div className="relative overflow-hidden bg-north-primary px-6 py-12 text-white md:px-12 md:py-16">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full border border-white/15"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 right-10 h-72 w-72 rounded-full border border-white/10"
          aria-hidden
        />
        <div className="relative max-w-2xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
            Asesoría North Bike
          </p>
          <h2 className="font-display text-3xl font-bold uppercase leading-tight tracking-[0.04em] md:text-5xl">
            ¿Compatible con tu bici?
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/85">
            Transmisión, ejes, tallas y suspensión no son genéricos. Te ayudamos
            a elegir componentes y protección que sí encajan con tu setup.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/products" variant="dark">
              Explorar productos
            </Button>
            <Button href="/products?category=componentes" variant="outline-light">
              Ver componentes
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
