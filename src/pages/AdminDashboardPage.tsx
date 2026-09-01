import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, CircleDollarSign, PackageCheck, ShoppingBag, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { fetchAdminSummary } from "@/lib/api/admin";
import type { AdminSummaryResponse } from "@/lib/api/types";
import { formatAdminPrice } from "@/lib/admin/format";

type Preset = "day" | "week" | "month" | "custom";

function dateRange(preset: Preset, customFrom: string, customTo: string) {
  if (preset === "custom") return { from: customFrom || undefined, to: customTo || undefined };
  const now = new Date();
  const start = new Date(now);
  if (preset === "day") start.setHours(0, 0, 0, 0);
  if (preset === "week") { const day = start.getDay(); start.setDate(start.getDate() - (day === 0 ? 6 : day - 1)); start.setHours(0, 0, 0, 0); }
  if (preset === "month") { start.setDate(1); start.setHours(0, 0, 0, 0); }
  return { from: start.toISOString(), to: now.toISOString() };
}

export default function AdminDashboardPage() {
  const [preset, setPreset] = useState<Preset>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [summary, setSummary] = useState<AdminSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const range = useMemo(() => dateRange(preset, customFrom, customTo), [preset, customFrom, customTo]);

  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    fetchAdminSummary(range).then((data) => { if (active) setSummary(data); }).catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : "No fue posible cargar el resumen."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [range]);

  const cards = [
    { label: "Ingresos confirmados", value: formatAdminPrice(summary?.revenue ?? 0), icon: CircleDollarSign, note: "Pedidos ecommerce pagados" },
    { label: "Pedidos pagados", value: String(summary?.paidOrders ?? 0), icon: ShoppingBag, note: "Operaciones confirmadas" },
    { label: "Unidades vendidas", value: String(summary?.unitsSold ?? 0), icon: PackageCheck, note: "Piezas en pedidos pagados" },
    { label: "Ticket promedio", value: formatAdminPrice(summary?.averageOrder ?? 0), icon: Truck, note: "Por pedido confirmado" },
  ];

  return <section className="px-4 py-8 lg:px-10 lg:py-10">
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-north-primary">Lectura comercial</p><h2 className="mt-2 font-display text-4xl font-bold uppercase tracking-[0.02em] text-north-dark">Resumen de ventas</h2><p className="mt-2 text-sm text-north-muted">Solo incluye pedidos ecommerce con pago confirmado.</p></div><Link to="/admin/orders" className="inline-flex items-center gap-2 self-start border border-north-border bg-white px-4 py-2.5 text-sm font-semibold text-north-dark transition hover:border-north-primary md:self-auto">Ver pedidos <ArrowUpRight className="h-4 w-4" /></Link></div>
      <div className="mt-8 flex flex-wrap items-center gap-2 border-y border-north-border py-4"><span className="mr-2 text-xs font-semibold uppercase tracking-[0.16em] text-north-muted">Periodo</span>{([['day','Hoy'],['week','Esta semana'],['month','Este mes'],['custom','Personalizado']] as [Preset,string][]).map(([value,label]) => <button key={value} type="button" onClick={() => setPreset(value)} className={`border px-3 py-2 text-xs font-semibold transition ${preset === value ? "border-north-dark bg-north-dark text-white" : "border-north-border bg-white text-north-dark hover:border-north-primary"}`}>{label}</button>)}{preset === "custom" && <><input type="date" value={customFrom} onChange={(event) => setCustomFrom(event.target.value)} className="h-9 border border-north-border bg-white px-2 text-xs text-north-dark" /><span className="text-xs text-north-muted">a</span><input type="date" value={customTo} onChange={(event) => setCustomTo(event.target.value)} className="h-9 border border-north-border bg-white px-2 text-xs text-north-dark" /></>}</div>
      {error && <div role="alert" className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{cards.map(({ label, value, icon: Icon, note }) => <article key={label} className="border border-north-border bg-white p-5"><div className="flex items-start justify-between"><p className="max-w-[150px] text-xs font-semibold uppercase tracking-[0.12em] text-north-muted">{label}</p><Icon className="h-5 w-5 text-north-primary" /></div><p className="mt-5 font-display text-3xl font-bold text-north-dark">{loading ? "—" : value}</p><p className="mt-2 text-xs text-north-muted">{note}</p></article>)}</div>
      <div className="mt-8 border border-north-border bg-white"><div className="flex items-center justify-between border-b border-north-border px-5 py-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-north-primary">Inventario que se mueve</p><h3 className="mt-1 font-display text-2xl font-bold uppercase text-north-dark">Productos más vendidos</h3></div><span className="text-xs text-north-muted">Top 10</span></div>{loading ? <p className="px-5 py-10 text-sm text-north-muted">Cargando métricas…</p> : !summary?.topProducts.length ? <p className="px-5 py-10 text-sm text-north-muted">Todavía no hay ventas ecommerce confirmadas en este periodo.</p> : <div className="divide-y divide-north-border">{summary.topProducts.map((product, index) => <div key={`${product.sku}-${product.variantLabel ?? "base"}`} className="grid grid-cols-[32px_1fr_auto] items-center gap-3 px-5 py-4 sm:grid-cols-[42px_1fr_110px_130px]"><span className="font-display text-xl font-bold text-north-border">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0"><p className="truncate text-sm font-semibold text-north-dark">{product.name}</p><p className="mt-1 truncate text-xs text-north-muted">{product.variantLabel || product.sku}</p></div><span className="hidden text-right text-sm text-north-muted sm:block">{product.unitsSold} uds.</span><span className="text-right text-sm font-semibold text-north-dark">{formatAdminPrice(product.revenue)}</span></div>)}</div>}</div>
    </div>
  </section>;
}
