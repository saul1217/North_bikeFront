import { useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, Search } from "lucide-react";
import { fetchAdminSyncedProducts, setAdminProductOnline } from "@/lib/api/admin";
import type { AdminProductListResponse, AdminSyncedProduct, OnlineRisk } from "@/lib/api/admin-types";
import { formatAdminPrice } from "@/lib/admin/format";
import { adminProductErrorMessage } from "@/lib/admin/manual-product-form";
import { Chip, inputClass, OnlineSwitch, Pager, ProductThumb } from "./shared";

const PAGE_SIZE = 25;

export const riskLabels: Record<OnlineRisk, { title: string; detail: string }> = {
  serialized: {
    title: "Con número de serie",
    detail: "La caja todavía no reconoce las unidades apartadas por la tienda (R5); su sincronización puede fallar.",
  },
  low_stock: {
    title: "Inventario bajo",
    detail: "La caja y la tienda comparten existencias; una venta en caja sin conexión o una edición desde la caja puede provocar sobreventa (R1/R2).",
  },
};

type Data = AdminProductListResponse<AdminSyncedProduct>;

export function SyncedProductsPanel() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<"" | "activo" | "inactivo">("");
  const [onlineEnabled, setOnlineEnabled] = useState<"" | "true" | "false">("");
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      fetchAdminSyncedProducts({ page, pageSize: PAGE_SIZE, search: search.trim() || undefined, category, status, onlineEnabled })
        .then((result) => {
          if (active) setData(result);
        })
        .catch((reason) => {
          if (active) setError(adminProductErrorMessage(reason, "No fue posible cargar los productos del POS."));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [search, category, status, onlineEnabled, page, reload]);

  function updateFilter<T>(setter: (value: T) => void, value: T) {
    setter(value);
    setPage(1);
  }

  async function toggle(product: AdminSyncedProduct, next: boolean) {
    setPending((current) => ({ ...current, [product.id]: true }));
    setRowErrors((current) => ({ ...current, [product.id]: "" }));
    setNotice("");
    try {
      // El cambio se refleja únicamente con la respuesta 200 del backend.
      const updated = await setAdminProductOnline(product.id, next);
      setData((current) => {
        if (!current) return current;
        const before = current.items.find((item) => item.id === product.id);
        const delta = before && before.onlineEnabled !== updated.onlineEnabled ? (updated.onlineEnabled ? 1 : -1) : 0;
        return {
          ...current,
          publishedTotal: current.publishedTotal + delta,
          items: current.items.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)),
        };
      });
      setNotice(`${updated.name}: ${updated.onlineEnabled ? "publicado en la tienda online" : "retirado de la tienda online"}.`);
    } catch (reason) {
      setRowErrors((current) => ({ ...current, [product.id]: adminProductErrorMessage(reason, "No se pudo cambiar la publicación.") }));
    } finally {
      setPending((current) => ({ ...current, [product.id]: false }));
    }
  }

  return (
    <div>
      <div className="border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" /> Avisos de sincronización</p>
        <p className="mt-1">
          Estos productos comparten existencias con la caja. El precio, el stock y los datos se editan en el POS; aquí solo decides si se ofrecen en la tienda online. Los productos nuevos empiezan sin publicar.
        </p>
        <ul className="mt-2 space-y-1">
          {(Object.keys(riskLabels) as OnlineRisk[]).map((risk) => (
            <li key={risk}><strong>{riskLabels[risk].title}:</strong> {riskLabels[risk].detail}</li>
          ))}
        </ul>
        <p className="mt-2"><strong>Lanzamiento con cobro real (LIVE): los productos sincronizados no se pueden comprar</strong> mientras no se autorice; el servidor rechaza el pago aunque estén publicados. Para la primera etapa vende con productos manuales.</p>
        <p className="mt-2">Los avisos no son una protección automática: los productos marcados quedan <strong>pendientes de revisión antes de vender con cobro real (LIVE)</strong>.</p>
      </div>

      <div className="mt-5 grid gap-3 border border-north-border bg-white p-4 md:grid-cols-2 xl:grid-cols-5">
        <label className="relative block xl:col-span-2">
          <span className="sr-only">Buscar producto del POS</span>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-north-muted" />
          <input value={search} onChange={(event) => updateFilter(setSearch, event.target.value)} maxLength={120} placeholder="Nombre, SKU, marca o código" className={`${inputClass} pl-9`} />
        </label>
        <select aria-label="Categoría" value={category} onChange={(event) => updateFilter(setCategory, event.target.value)} className={inputClass}>
          <option value="">Categoría: todas</option>
          {data?.categories.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
        <select aria-label="Estado en el POS" value={status} onChange={(event) => updateFilter(setStatus, event.target.value as typeof status)} className={inputClass}>
          <option value="">Estado POS: todos</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
        <select aria-label="Publicación" value={onlineEnabled} onChange={(event) => updateFilter(setOnlineEnabled, event.target.value as typeof onlineEnabled)} className={inputClass}>
          <option value="">Publicación: todos</option>
          <option value="true">Publicados</option>
          <option value="false">No publicados</option>
        </select>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-north-muted">
        <span>{data ? <><strong className="text-north-dark">{data.publishedTotal}</strong> productos del POS publicados en total</> : " "}</span>
        <button type="button" onClick={() => setReload((value) => value + 1)} className="inline-flex items-center gap-1 text-xs font-semibold text-north-primary hover:text-north-dark"><RefreshCw className="h-3.5 w-3.5" /> Actualizar</button>
      </div>

      {notice && <p role="status" className="mt-3 border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{notice}</p>}
      {error && <div role="alert" className="mt-3 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

      <div className="mt-3 border border-north-border bg-white">
        {loading && !data ? (
          <p className="px-5 py-12 text-sm text-north-muted">Cargando productos del POS…</p>
        ) : !data?.items.length ? (
          <p className="px-5 py-12 text-sm text-north-muted">No hay productos del POS que coincidan con estos filtros.</p>
        ) : (
          <>
            <ul className={`divide-y divide-north-border ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
              {data.items.map((product) => {
                const risks = product.onlineRisks ?? [];
                return (
                  <li key={product.id} className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:px-5" data-testid="synced-product">
                    <div className="flex min-w-0 gap-4">
                      <ProductThumb src={product.image} alt={product.name} />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-north-dark">{product.name}</p>
                        <p className="mt-0.5 text-xs text-north-muted">
                          SKU {product.sku} · {product.category} · {formatAdminPrice(product.price)} · Existencia {product.stock}
                          {product.hasVariants ? ` · ${product.variantCount} variantes` : ""}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Chip tone="teal">Sincronizado con POS</Chip>
                          <Chip tone={product.status === "activo" ? "green" : "gray"}>{product.status === "activo" ? "Activo en POS" : "Inactivo en POS"}</Chip>
                          <Chip tone={product.onlineEnabled ? "green" : "gray"}>{product.onlineEnabled ? "Publicado" : "No publicado"}</Chip>
                          {risks.map((risk) => (
                            <span key={risk} title={riskLabels[risk]?.detail}>
                              <Chip tone="amber"><AlertTriangle className="h-3 w-3" /> {riskLabels[risk]?.title ?? risk}</Chip>
                            </span>
                          ))}
                          {risks.length > 0 && <Chip tone="red">Pendiente para LIVE</Chip>}
                        </div>
                        {product.onlineEnabled && product.status !== "activo" && (
                          <p className="mt-2 text-xs text-north-muted">Está inactivo en el POS: no se muestra en la tienda aunque esté publicado.</p>
                        )}
                      </div>
                    </div>
                    <div className="md:text-right">
                      <OnlineSwitch
                        checked={product.onlineEnabled}
                        pending={Boolean(pending[product.id])}
                        onChange={(next) => toggle(product, next)}
                        label={`Disponible en tienda online: ${product.name}`}
                      />
                      {rowErrors[product.id] && <p role="alert" className="mt-2 max-w-xs text-xs text-red-700 md:ml-auto">{rowErrors[product.id]}</p>}
                    </div>
                  </li>
                );
              })}
            </ul>
            <Pager pagination={data.pagination} page={page} onPage={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
