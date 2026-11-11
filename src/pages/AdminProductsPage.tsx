import { useSearchParams } from "react-router-dom";
import { ManualProductsPanel } from "@/components/admin/products/ManualProductsPanel";
import { SyncedProductsPanel } from "@/components/admin/products/SyncedProductsPanel";

const tabs = [
  { id: "pos", label: "Sincronizados con el POS", hint: "Productos de la caja: solo se publican o retiran." },
  { id: "manual", label: "Manuales / Solo tienda online", hint: "Productos que se crean y administran aquí." },
] as const;

export default function AdminProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const active = searchParams.get("tab") === "manual" ? "manual" : "pos";

  return (
    <section className="px-4 py-8 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-north-primary">Tienda online</p>
        <h2 className="mt-2 font-display text-4xl font-bold uppercase tracking-[0.02em] text-north-dark">Productos de la tienda online</h2>
        <p className="mt-2 max-w-3xl text-sm text-north-muted">Decide qué se vende por internet. Cada producto indica si está sincronizado con el POS o si es manual.</p>

        <div role="tablist" aria-label="Origen de los productos" className="mt-7 grid gap-2 sm:grid-cols-2 lg:inline-grid">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={active === tab.id}
              aria-controls={`panel-${tab.id}`}
              onClick={() => setSearchParams(tab.id === "pos" ? {} : { tab: tab.id })}
              className={`border px-4 py-3 text-left transition ${active === tab.id ? "border-north-primary bg-white shadow-sm" : "border-north-border bg-white/50 hover:border-north-steel"}`}
            >
              <span className="block text-sm font-semibold text-north-dark">{tab.label}</span>
              <span className="mt-0.5 block text-xs text-north-muted">{tab.hint}</span>
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`panel-${active}`} aria-labelledby={`tab-${active}`} className="mt-6">
          {active === "pos" ? <SyncedProductsPanel /> : <ManualProductsPanel />}
        </div>
      </div>
    </section>
  );
}
