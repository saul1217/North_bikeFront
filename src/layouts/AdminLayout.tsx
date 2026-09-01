import { BarChart3, LogOut, PackageSearch, PanelLeft, ShieldCheck } from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { href: "/admin", label: "Resumen", icon: BarChart3, end: true },
  { href: "/admin/orders", label: "Pedidos", icon: PackageSearch, end: false },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function signOut() {
    logout();
    navigate("/admin/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-[#eef2f1] text-north-dark">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-north-dark text-white lg:flex">
        <div className="flex h-24 items-center border-b border-white/10 px-7">
          <BrandLogo variant="light" />
          <div className="ml-3">
            <p className="font-display text-xl font-bold uppercase tracking-[0.12em]">North Bike</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-[0.22em] text-north-steel-muted">Control center</p>
          </div>
        </div>
        <div className="px-5 pt-9">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.22em] text-north-steel-muted">Operación ecommerce</p>
          <nav className="mt-4 space-y-1">
            {navItems.map(({ href, label, icon: Icon, end }) => (
              <NavLink key={href} to={href} end={end} className={({ isActive }) => `group flex items-center gap-3 border-l-2 px-3 py-3 text-sm transition ${isActive ? "border-[#e0a458] bg-white/10 text-white" : "border-transparent text-white/60 hover:border-white/30 hover:bg-white/5 hover:text-white"}`}>
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="mt-auto border-t border-white/10 p-5">
          <div className="flex items-center gap-3 rounded-sm bg-white/5 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e0a458] font-display font-bold text-north-dark">{user?.username.slice(0, 1).toUpperCase()}</div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.username}</p>
              <p className="mt-0.5 flex items-center gap-1 text-[10px] uppercase tracking-[0.15em] text-north-steel-muted"><ShieldCheck className="h-3 w-3" /> Administrador</p>
            </div>
          </div>
          <button type="button" onClick={signOut} className="mt-4 flex w-full items-center gap-2 px-3 py-2 text-xs text-white/60 transition hover:text-white"><LogOut className="h-4 w-4" /> Cerrar sesión</button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#d8e1df] bg-[#eef2f1]/95 px-4 backdrop-blur-md lg:ml-64 lg:px-10">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-north-steel">Panel administrativo</p>
          <h1 className="font-display text-2xl font-bold uppercase tracking-[0.04em]">{location.pathname.includes("orders") ? "Pedidos ecommerce" : "Resumen comercial"}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-north-muted sm:block">Sesión de {user?.username}</span>
          <button type="button" onClick={signOut} className="rounded-sm border border-[#cbd7d4] bg-white p-2 text-north-primary transition hover:border-north-primary lg:hidden" aria-label="Cerrar sesión"><LogOut className="h-4 w-4" /></button>
        </div>
      </header>

      <main className="lg:ml-64">
        <div className="border-b border-[#d8e1df] bg-white/60 px-4 py-3 lg:px-10">
          <div className="flex items-center gap-2 text-xs text-north-muted"><PanelLeft className="h-3.5 w-3.5 text-[#c28437]" /> NorthBike / Administración</div>
        </div>
        <Outlet />
      </main>
    </div>
  );
}
