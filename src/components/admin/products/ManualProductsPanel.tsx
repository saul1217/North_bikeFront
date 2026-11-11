import { useEffect, useState } from "react";
import { Info, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import {
  deleteAdminManualProduct,
  fetchAdminManualProduct,
  fetchAdminManualProducts,
  setAdminManualProductPublished,
} from "@/lib/api/admin";
import type { AdminManualProduct, AdminProductListResponse } from "@/lib/api/admin-types";
import { formatAdminPrice } from "@/lib/admin/format";
import { adminProductErrorMessage } from "@/lib/admin/manual-product-form";
import { ManualProductForm } from "./ManualProductForm";
import { Chip, inputClass, OnlineSwitch, Pager, ProductThumb } from "./shared";

const PAGE_SIZE = 25;
export const MANUAL_STOCK_NOTICE = "Las existencias se administran aquí; las ventas físicas no se descuentan automáticamente.";

type Data = AdminProductListResponse<AdminManualProduct>;
type Mode = { kind: "list" } | { kind: "create" } | { kind: "edit"; product: AdminManualProduct };

export function ManualProductsPanel() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [published, setPublished] = useState<"" | "true" | "false">("");
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [mode, setMode] = useState<Mode>({ kind: "list" });
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [opening, setOpening] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      fetchAdminManualProducts({ page, pageSize: PAGE_SIZE, search: search.trim() || undefined, category, published })
        .then((result) => {
          if (active) setData(result);
        })
        .catch((reason) => {
          if (active) setError(adminProductErrorMessage(reason, "No fue posible cargar los productos manuales."));
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [search, category, published, page, reload]);

  function updateFilter<T>(setter: (value: T) => void, value: T) {
    setter(value);
    setPage(1);
  }

  function setRowError(id: string, message: string) {
    setRowErrors((current) => ({ ...current, [id]: message }));
  }

  async function togglePublished(product: AdminManualProduct, next: boolean) {
    setPending((current) => ({ ...current, [product.id]: true }));
    setRowError(product.id, "");
    setNotice("");
    try {
      // Solo se refleja con la respuesta del backend.
      const updated = await setAdminManualProductPublished(product.id, next);
      setData((current) => {
        if (!current) return current;
        const before = current.items.find((item) => item.id === product.id);
        const delta = before && before.published !== updated.published ? (updated.published ? 1 : -1) : 0;
        return { ...current, publishedTotal: current.publishedTotal + delta, items: current.items.map((item) => (item.id === updated.id ? updated : item)) };
      });
      setNotice(`${updated.name}: ${updated.published ? "publicado en la tienda online" : "retirado de la venta online"}.`);
    } catch (reason) {
      setRowError(product.id, adminProductErrorMessage(reason, "No se pudo cambiar la publicación."));
    } finally {
      setPending((current) => ({ ...current, [product.id]: false }));
    }
  }

  async function openEdit(product: AdminManualProduct) {
    setOpening(product.id);
    setRowError(product.id, "");
    try {
      // Se edita sobre el detalle actual del servidor, no sobre la lista.
      const fresh = await fetchAdminManualProduct(product.id);
      setMode({ kind: "edit", product: fresh });
    } catch (reason) {
      setRowError(product.id, adminProductErrorMessage(reason, "No se pudo abrir el producto."));
    } finally {
      setOpening(null);
    }
  }

  async function remove(product: AdminManualProduct) {
    setPending((current) => ({ ...current, [product.id]: true }));
    setRowError(product.id, "");
    try {
      await deleteAdminManualProduct(product.id);
      setConfirmDelete(null);
      setNotice(`${product.name} se retiró de la tienda online. Los pedidos históricos se conservan.`);
      setReload((value) => value + 1);
    } catch (reason) {
      setRowError(product.id, adminProductErrorMessage(reason, "No se pudo retirar el producto."));
    } finally {
      setPending((current) => ({ ...current, [product.id]: false }));
    }
  }

  const banner = (
    <div className="flex items-start gap-2 border border-violet-200 bg-violet-50 p-4 text-sm leading-6 text-violet-950" role="note">
      <Info className="mt-1 h-4 w-4 shrink-0" />
      <div>
        <p className="font-semibold">{MANUAL_STOCK_NOTICE}</p>
        <p className="mt-1">Estos productos solo existen en la tienda online y nunca aparecen en el POS. Si también vendes la pieza en mostrador, ajusta aquí la existencia a mano para evitar sobreventa.</p>
      </div>
    </div>
  );

  if (mode.kind !== "list") {
    return (
      <div className="space-y-5">
        {banner}
        <ManualProductForm
          key={mode.kind === "edit" ? mode.product.id : "new"}
          product={mode.kind === "edit" ? mode.product : undefined}
          categories={data?.categories ?? []}
          onCancel={() => setMode({ kind: "list" })}
          onSaved={(_product, message) => {
            setMode({ kind: "list" });
            setNotice(message);
            setReload((value) => value + 1);
          }}
        />
      </div>
    );
  }

  return (
    <div>
      {banner}

      <div className="mt-5 grid gap-3 border border-north-border bg-white p-4 md:grid-cols-2 xl:grid-cols-5">
        <label className="relative block xl:col-span-2">
          <span className="sr-only">Buscar producto manual</span>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-north-muted" />
          <input value={search} onChange={(event) => updateFilter(setSearch, event.target.value)} maxLength={120} placeholder="Nombre, SKU o descripción" className={`${inputClass} pl-9`} />
        </label>
        <select aria-label="Categoría" value={category} onChange={(event) => updateFilter(setCategory, event.target.value)} className={inputClass}>
          <option value="">Categoría: todas</option>
          {data?.categories.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
        <select aria-label="Publicación" value={published} onChange={(event) => updateFilter(setPublished, event.target.value as typeof published)} className={inputClass}>
          <option value="">Publicación: todos</option>
          <option value="true">Publicados</option>
          <option value="false">No publicados</option>
        </select>
        <button type="button" onClick={() => { setNotice(""); setMode({ kind: "create" }); }} className="inline-flex h-10 items-center justify-center gap-2 bg-north-primary px-4 text-sm font-semibold text-white hover:bg-north-dark">
          <Plus className="h-4 w-4" /> Nuevo producto
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-north-muted">
        <span>{data ? <><strong className="text-north-dark">{data.publishedTotal}</strong> productos manuales publicados en total</> : " "}</span>
        <button type="button" onClick={() => setReload((value) => value + 1)} className="inline-flex items-center gap-1 text-xs font-semibold text-north-primary hover:text-north-dark"><RefreshCw className="h-3.5 w-3.5" /> Actualizar</button>
      </div>

      {notice && <p role="status" className="mt-3 border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{notice}</p>}
      {error && <div role="alert" className="mt-3 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}

      <div className="mt-3 border border-north-border bg-white">
        {loading && !data ? (
          <p className="px-5 py-12 text-sm text-north-muted">Cargando productos manuales…</p>
        ) : !data?.items.length ? (
          <p className="px-5 py-12 text-sm text-north-muted">No hay productos manuales que coincidan. Crea uno con «Nuevo producto».</p>
        ) : (
          <>
            <ul className={`divide-y divide-north-border ${loading ? "opacity-60" : ""}`} aria-busy={loading}>
              {data.items.map((product) => (
                <li key={product.id} className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:px-5" data-testid="manual-product">
                  <div className="flex min-w-0 gap-4">
                    <ProductThumb src={product.image} alt={product.name} />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-north-dark">{product.name}</p>
                      <p className="mt-0.5 text-xs text-north-muted">
                        {product.sku ? `SKU ${product.sku}` : "Sin SKU"} · {product.category} · {formatAdminPrice(product.price)} · Existencia web {product.stock}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Chip tone="violet">Manual / No sincronizado</Chip>
                        <Chip tone={product.published ? "green" : "gray"}>{product.published ? "Publicado" : "No publicado"}</Chip>
                        {product.stock === 0 && <Chip tone="red">Agotado</Chip>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 md:items-end">
                    <OnlineSwitch
                      checked={product.published}
                      pending={Boolean(pending[product.id])}
                      onChange={(next) => togglePublished(product, next)}
                      label={`Disponible en tienda online: ${product.name}`}
                    />
                    {confirmDelete === product.id ? (
                      <div className="max-w-xs border border-red-200 bg-red-50 p-3 text-xs text-red-900" role="alertdialog" aria-label={`Confirmar retiro de ${product.name}`}>
                        <p>Se retira de la tienda online de forma definitiva y deja de venderse. Los pedidos históricos no se borran.</p>
                        <div className="mt-2 flex gap-2">
                          <button type="button" disabled={pending[product.id]} onClick={() => remove(product)} className="bg-red-700 px-3 py-1.5 font-semibold text-white disabled:opacity-60">Sí, retirar</button>
                          <button type="button" onClick={() => setConfirmDelete(null)} className="border border-red-200 bg-white px-3 py-1.5 font-semibold text-red-900">Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button type="button" disabled={opening === product.id} onClick={() => openEdit(product)} className="inline-flex items-center gap-1 border border-north-border px-3 py-1.5 text-xs font-semibold text-north-dark hover:border-north-primary disabled:opacity-60"><Pencil className="h-3.5 w-3.5" /> {opening === product.id ? "Abriendo…" : "Editar"}</button>
                        <button type="button" onClick={() => setConfirmDelete(product.id)} className="inline-flex items-center gap-1 border border-north-border px-3 py-1.5 text-xs font-semibold text-red-700 hover:border-red-400"><Trash2 className="h-3.5 w-3.5" /> Retirar</button>
                      </div>
                    )}
                    {rowErrors[product.id] && <p role="alert" className="max-w-xs text-xs text-red-700">{rowErrors[product.id]}</p>}
                  </div>
                </li>
              ))}
            </ul>
            <Pager pagination={data.pagination} page={page} onPage={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
