import { AlertCircle, LoaderCircle, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function CatalogLoading() {
  return (
    <div className="container-page flex min-h-[26rem] items-center justify-center py-16">
      <div className="flex items-center gap-3 text-sm text-north-muted" role="status">
        <LoaderCircle className="h-5 w-5 animate-spin text-north-primary" />
        Cargando catálogo real…
      </div>
    </div>
  );
}

export function CatalogError({ message, status }: { message: string; status?: number }) {
  const statusMessage = {
    401: "El backend todavía solicita autenticación para consultar el catálogo público.",
    403: "El backend rechazó el acceso al catálogo público.",
    404: "La ruta de catálogo no existe en el backend desplegado.",
    409: "El catálogo cambió mientras se consultaba. Inténtalo de nuevo.",
    429: "El backend limitó temporalmente las solicitudes. Espera un momento.",
  }[status ?? 0];

  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-xl border border-north-border bg-white p-8 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-north-primary" />
        <h1 className="mt-4 font-display text-2xl font-bold uppercase tracking-wide">
          Catálogo no disponible
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-north-muted">
          {statusMessage ?? "No se cargaron productos desde el backend. No mostraremos datos de demostración."}
        </p>
        <p className="mt-3 text-xs text-north-steel">{message}</p>
        <Button onClick={() => window.location.reload()} className="mt-6">
          Intentar de nuevo
        </Button>
      </div>
    </div>
  );
}

export function CatalogEmpty() {
  return (
    <div className="container-page py-16">
      <div className="mx-auto max-w-xl border border-north-border bg-white p-8 text-center">
        <PackageSearch className="mx-auto h-8 w-8 text-north-steel" />
        <h1 className="mt-4 font-display text-2xl font-bold uppercase tracking-wide">
          Catálogo vacío
        </h1>
        <p className="mt-3 text-sm text-north-muted">
          La API respondió correctamente, pero no hay productos activos publicados.
        </p>
      </div>
    </div>
  );
}
