import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-start gap-4 py-24">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-north-steel">
        404
      </p>
      <h1 className="font-display text-4xl font-bold uppercase tracking-wide text-north-dark">
        Página no encontrada
      </h1>
      <p className="max-w-md text-north-muted">
        El producto o ruta que buscas no existe.
      </p>
      <div className="flex gap-3">
        <Button href="/">Ir al inicio</Button>
        <Button href="/products" variant="ghost">
          Ver catálogo
        </Button>
      </div>
      <Link to="/" className="sr-only">
        Inicio
      </Link>
    </div>
  );
}
