import Link from "next/link";

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-slate-100 flex flex-col shadow-lg">
      <div className="p-6 border-b border-slate-800">
        <h2 className="text-xl font-black tracking-wider text-blue-400">PRINT ERP</h2>
        <p className="text-xs text-slate-400 mt-1">Gestión Integral</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <Link
          href="/admin"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors"
        >
          📊 Panel de Control
        </Link>

        <div className="pt-4 pb-1">
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Comercial & Maestros
          </p>
        </div>

        <Link
          href="/admin/productos"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors"
        >
          📦 Productos
        </Link>

        <Link
          href="/admin/clientes"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors"
        >
          👥 Clientes
        </Link>

        <Link
          href="/admin/proveedores"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 hover:text-white transition-colors"
        >
          🏢 Proveedores
        </Link>

        <div className="pt-4 pb-1">
          <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Operaciones (Próximamente)
          </p>
        </div>

        <span className="flex items-center gap-3 px-3 py-2 text-sm text-slate-500 cursor-not-allowed">
          🧾 Pedidos & Ventas
        </span>

        <span className="flex items-center gap-3 px-3 py-2 text-sm text-slate-500 cursor-not-allowed">
          🖨️ Taller & Producción
        </span>

        <span className="flex items-center gap-3 px-3 py-2 text-sm text-slate-500 cursor-not-allowed">
          💵 Caja
        </span>
      </nav>

      <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
        v1.0 - Modo Producción
      </div>
    </aside>
  );
}