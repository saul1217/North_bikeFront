import { ArrowRight, Compass } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="relative isolate flex min-h-[clamp(34rem,70vh,48rem)] items-center overflow-hidden bg-north-dark text-white">
      <div className="surface-dark-texture absolute inset-0 -z-10 opacity-90" />
      <div className="absolute -right-32 top-1/2 -z-10 h-[34rem] w-[34rem] -translate-y-1/2 rounded-full border border-white/10 sm:-right-20" />
      <div className="absolute right-16 top-1/2 -z-10 h-[20rem] w-[20rem] -translate-y-1/2 rounded-full border border-[#e0a458]/20" />
      <div className="absolute bottom-0 left-0 h-1 w-32 bg-[#e0a458]" />
      <div className="container-page grid w-full gap-12 py-20 lg:grid-cols-[minmax(0,0.85fr)_minmax(20rem,0.7fr)] lg:items-center lg:gap-20">
        <div>
          <div className="flex items-center gap-3 text-[#e0a458]">
            <Compass className="h-5 w-5" aria-hidden="true" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em]">Ruta fuera de mapa</p>
          </div>
          <p className="mt-7 font-display text-[clamp(7rem,20vw,14rem)] font-bold leading-[0.72] tracking-[-0.07em] text-white/[0.08]" aria-hidden="true">404</p>
          <div className="-mt-4 max-w-xl sm:-mt-7">
            <h1 className="font-display text-5xl font-bold uppercase leading-[0.92] tracking-[0.02em] sm:text-6xl">Este camino no lleva a ninguna parte.</h1>
            <p className="mt-6 max-w-md text-base leading-7 text-white/60">La página que buscas no existe o cambió de ruta. Regresa al inicio y encuentra de nuevo tu próxima rodada.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/" variant="dark">Ir al inicio <ArrowRight className="h-4 w-4" /></Button>
              <Button href="/products" variant="outline-light">Explorar catálogo</Button>
            </div>
          </div>
        </div>
        <div className="relative hidden min-h-[19rem] items-center justify-center lg:flex" aria-hidden="true">
          <div className="absolute h-64 w-64 rounded-full border border-dashed border-white/20" />
          <div className="absolute h-44 w-44 rounded-full border border-[#e0a458]/30" />
          <div className="relative flex h-28 w-28 rotate-12 items-center justify-center border border-[#e0a458]/60 bg-[#e0a458] font-display text-5xl font-bold text-north-dark shadow-[14px_14px_0_rgba(255,255,255,0.08)]">NB</div>
          <span className="absolute bottom-4 right-10 text-[10px] uppercase tracking-[0.25em] text-white/35">NorthBike / 404</span>
        </div>
      </div>
    </div>
  );
}
