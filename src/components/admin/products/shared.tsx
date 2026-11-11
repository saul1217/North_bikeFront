import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { useState } from "react";
import type { AdminPagination } from "@/lib/api/admin-types";

export const inputClass =
  "h-10 w-full border border-north-border bg-[#f8faf9] px-3 text-sm text-north-dark outline-none focus:border-north-primary";

export function ProductThumb({ src, alt }: { src: string | null; alt: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden border border-north-border bg-[#eef2f1]">
      {src && !failed ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <ImageOff className="h-5 w-5 text-north-steel" aria-label="Sin imagen" />
      )}
    </div>
  );
}

export function Chip({ tone, children }: { tone: "green" | "gray" | "red" | "amber" | "teal" | "violet"; children: React.ReactNode }) {
  const tones = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    gray: "border-north-border bg-[#f8faf9] text-north-muted",
    red: "border-red-200 bg-red-50 text-red-800",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    teal: "border-teal-200 bg-teal-50 text-teal-800",
    violet: "border-violet-200 bg-violet-50 text-violet-800",
  };
  return <span className={`inline-flex items-center gap-1 border px-2 py-0.5 text-[11px] font-semibold ${tones[tone]}`}>{children}</span>;
}

/** Interruptor accesible. No cambia su estado por sí solo: lo decide la respuesta del backend. */
export function OnlineSwitch({ checked, pending, disabled, onChange, label }: { checked: boolean; pending: boolean; disabled?: boolean; onChange: (next: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      aria-busy={pending}
      disabled={pending || disabled}
      onClick={() => onChange(!checked)}
      className="group inline-flex items-center gap-2 text-left text-xs font-semibold text-north-dark disabled:cursor-wait disabled:opacity-60"
    >
      <span className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${checked ? "bg-north-primary" : "bg-[#cbd7d4]"}`}>
        <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
      </span>
      <span>{pending ? "Guardando…" : checked ? "Disponible en tienda online" : "No disponible en tienda online"}</span>
    </button>
  );
}

export function Pager({ pagination, page, onPage }: { pagination: AdminPagination; page: number; onPage: (page: number) => void }) {
  return (
    <div className="flex items-center justify-between border-t border-north-border px-5 py-4">
      <span className="text-xs text-north-muted">
        Página {pagination.page} de {pagination.totalPages || 1} · {pagination.total} productos
      </span>
      <div className="flex gap-2">
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="border border-north-border p-2 text-north-dark disabled:opacity-30" aria-label="Página anterior">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button type="button" disabled={page >= pagination.totalPages} onClick={() => onPage(page + 1)} className="border border-north-border p-2 text-north-dark disabled:opacity-30" aria-label="Página siguiente">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
