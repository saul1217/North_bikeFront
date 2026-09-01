import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useAuth } from "@/context/AuthContext";

export default function AdminLoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Acceso administrativo | NorthBike";
  }, []);

  if (user) return <Navigate to="/admin" replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username.trim(), password);
      const destination = (location.state as { from?: string } | null)?.from ?? "/admin";
      navigate(destination, { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No fue posible iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-[#eef2f1] lg:grid-cols-[minmax(360px,0.82fr)_1.18fr]">
      <section className="relative hidden overflow-hidden bg-north-dark p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 top-24 h-72 w-72 rounded-full border border-white/10" />
        <div className="absolute -right-10 top-38 h-44 w-44 rounded-full border border-[#e0a458]/30" />
        <div className="relative z-10 flex items-center gap-4">
          <BrandLogo variant="light" />
          <div><p className="font-display text-2xl font-bold uppercase tracking-[0.12em]">North Bike</p><p className="text-[10px] uppercase tracking-[0.28em] text-north-steel-muted">Retail operations</p></div>
        </div>
        <div className="relative z-10 max-w-md">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-[#e0a458]">Centro de control · 01</p>
          <h1 className="font-display text-6xl font-bold uppercase leading-[0.9] tracking-[0.02em]">Todo el pulso de tu tienda.</h1>
          <p className="mt-7 max-w-sm text-sm leading-7 text-white/60">Consulta las ventas del ecommerce y acompaña cada pedido hasta su entrega, con una vista clara para el equipo NorthBike.</p>
        </div>
        <p className="relative z-10 text-[10px] uppercase tracking-[0.22em] text-white/35">Acceso restringido a administradores</p>
      </section>
      <section className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-12 flex items-center gap-3 lg:hidden"><BrandLogo /><div><p className="font-display text-xl font-bold uppercase tracking-[0.1em]">North Bike</p><p className="text-[10px] uppercase tracking-[0.2em] text-north-muted">Administración</p></div></div>
          <div className="mb-10"><div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-north-dark text-[#e0a458]"><LockKeyhole className="h-5 w-5" /></div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-north-primary">Acceso seguro</p><h2 className="mt-3 font-display text-4xl font-bold uppercase leading-none tracking-[0.03em] text-north-dark">Entrar al panel</h2><p className="mt-4 text-sm leading-6 text-north-muted">Usa las credenciales administrativas entregadas por NorthBike.</p></div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block text-sm font-semibold text-north-dark">Usuario<input required value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" className="mt-2 h-12 w-full border border-north-border bg-white px-4 font-normal outline-none transition focus:border-north-primary focus:ring-2 focus:ring-north-primary/10" /></label>
            <label className="block text-sm font-semibold text-north-dark">Contraseña<input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className="mt-2 h-12 w-full border border-north-border bg-white px-4 font-normal outline-none transition focus:border-north-primary focus:ring-2 focus:ring-north-primary/10" /></label>
            {error && <p role="alert" className="border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-800">{error}</p>}
            <button disabled={loading} type="submit" className="group flex h-12 w-full items-center justify-center gap-2 bg-north-dark px-5 text-sm font-bold text-white transition hover:bg-north-primary disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Validando…" : "Entrar al panel"}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></button>
          </form>
          <p className="mt-9 flex items-start gap-2 border-t border-north-border pt-5 text-xs leading-5 text-north-muted"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-north-primary" /> Tu sesión se guarda únicamente mientras mantengas abierta esta ventana.</p>
        </div>
      </section>
    </main>
  );
}
