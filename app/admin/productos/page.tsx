"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  precio_costo?: number;
  categoria?: string;
  rubro?: string;
  subcategoria?: string;
  imagen_url?: string;
  existencia?: number;
  stock_minimo?: number;
  en_oferta?: boolean;
  texto_oferta?: string;
  color_oferta?: string;
}

interface PerfilUsuario {
  email: string;
  rol: "admin" | "operador" | "cliente";
}

const CATEGORIAS = [
  "Todos",
  "Librería",
  "Descartables",
  "Cotillón",
  "Regalería",
  "Juguetería",
];

const ESTILOS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  rojo: { bg: "#ef4444", color: "#ffffff", label: "Promo Fuerte" },
  amarillo: { bg: "#facc15", color: "#854d0e", label: "Liquidación" },
  verde: { bg: "#10b981", color: "#ffffff", label: "Nuevo Ingreso" },
  violeta: { bg: "#8b5cf6", color: "#ffffff", label: "Especial Regalo" },
};

export default function AdminProductosPage() {
  const router = useRouter();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [verificandoAuth, setVerificandoAuth] = useState(true);

  const [cargando, setCargando] = useState(true);
  const [vistaGaleria, setVistaGaleria] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [rubroSeleccionado, setRubroSeleccionado] = useState("Todos");
  const [soloOfertas, setSoloOfertas] = useState(false);

  // Verificación de autenticación y rol
  useEffect(() => {
    async function verificarSesion() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: perfilData, error } = await supabase
        .from("perfiles")
        .select("email, rol")
        .eq("id", user.id)
        .maybeSingle();

      if (error || !perfilData || perfilData.rol === "cliente") {
        await supabase.auth.signOut();
        router.push("/login");
        return;
      }

      setPerfil(perfilData as PerfilUsuario);
      setVerificandoAuth(false);
      cargarProductos();
    }

    verificarSesion();
  }, [router]);

  const cargarProductos = async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from("productos")
      .select("*")
      .order("id", { ascending: false });

    if (!error && data) {
      setProductos(data);
    }
    setCargando(false);
  };

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleEliminar = async (id: number, titulo: string) => {
    if (perfil?.rol !== "admin") {
      alert("Solo un Administrador puede eliminar productos.");
      return;
    }

    if (!confirm(`¿Estás seguro de que deseas eliminar "${titulo}"?`)) return;

    try {
      const res = await fetch(`/api/productos/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProductos((prev) => prev.filter((p) => p.id !== id));
      } else {
        const err = await res.json().catch(() => null);
        alert("Error al eliminar: " + (err?.error || "Error de servidor"));
      }
    } catch {
      alert("Error de conexión al eliminar");
    }
  };

  const handleToggleOferta = async (prod: Producto) => {
    const nuevoEstado = !prod.en_oferta;
    const { error } = await supabase
      .from("productos")
      .update({
        en_oferta: nuevoEstado,
        texto_oferta: nuevoEstado ? (prod.texto_oferta || "OFERTA") : null,
      })
      .eq("id", prod.id);

    if (!error) {
      setProductos((prev) =>
        prev.map((item) =>
          item.id === prod.id
            ? {
                ...item,
                en_oferta: nuevoEstado,
                texto_oferta: nuevoEstado ? (prod.texto_oferta || "OFERTA") : undefined,
              }
            : item
        )
      );
    } else {
      alert("No se pudo actualizar la oferta: " + error.message);
    }
  };

  const duplicarProducto = (prod: Producto) => {
    const query = new URLSearchParams({
      nombre: `${prod.nombre} (Copia)`,
      categoria: prod.categoria || prod.rubro || "Librería",
      subcategoria: prod.subcategoria || "",
      precio: prod.precio?.toString() || "0",
      precio_costo: perfil?.rol === "admin" ? (prod.precio_costo?.toString() || "0") : "0",
      imagen_url: prod.imagen_url || "",
    });
    router.push(`/admin/productos/nuevo?${query.toString()}`);
  };

  const productosFiltrados = productos.filter((p) => {
    const coincideTexto = p.nombre?.toLowerCase().includes(busqueda.toLowerCase());
    const categoriaItem = p.categoria || p.rubro || "";
    const coincideRubro =
      rubroSeleccionado === "Todos" ||
      categoriaItem.toLowerCase().includes(rubroSeleccionado.toLowerCase());
    const coincideOferta = !soloOfertas || Boolean(p.en_oferta);
    return coincideTexto && coincideRubro && coincideOferta;
  });

  if (verificandoAuth) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center font-sans">
        <div className="text-center">
          <div className="text-3xl mb-2">🔒</div>
          <p className="text-slate-500 font-bold text-sm">Verificando permisos de acceso...</p>
        </div>
      </main>
    );
  }

  const esAdmin = perfil?.rol === "admin";

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto">
        
        {/* ENCABEZADO CON INFO DE USUARIO Y ROL */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-extrabold text-slate-900">Catálogo de Productos</h1>
              <span className="bg-blue-100 text-blue-800 font-bold text-xs px-3 py-1 rounded-full">
                {productosFiltrados.length} en vista
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-1">
              Gestioná tu escaparate, cambiá promociones y controlá stocks de manera visual.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Indicador de usuario conectado */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-bold text-slate-700">{perfil?.email}</span>
              <span className={`px-2 py-0.5 rounded-md font-black uppercase text-[10px] ${
                esAdmin ? "bg-purple-100 text-purple-700" : "bg-amber-100 text-amber-800"
              }`}>
                {esAdmin ? "Dueño / Admin" : "Operador"}
              </span>
            </div>

            <Link
              href="/admin/productos/nuevo"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl shadow-sm transition-all text-sm flex items-center gap-1.5"
            >
              <span>+</span> Nuevo
            </Link>

            <Link
              href="/tienda"
              target="_blank"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-2 rounded-xl text-sm transition-colors"
            >
              Tienda ↗
            </Link>

            {/* BOTÓN SALIR / CERRAR SESIÓN */}
            <button
              type="button"
              onClick={handleCerrarSesion}
              className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-3 py-2 rounded-xl text-xs transition-colors border border-rose-200"
              title="Cerrar sesión"
            >
              Salir
            </button>
          </div>
        </div>

        {/* BARRA DE FILTROS Y CONTROL DE VISTA */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col lg:flex-row justify-between items-center gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-72">
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-blue-500 bg-slate-50"
              />
              <span className="absolute left-3 top-2.5 text-slate-400 text-sm">🔍</span>
            </div>

            <select
              value={rubroSeleccionado}
              onChange={(e) => setRubroSeleccionado(e.target.value)}
              className="border border-slate-300 rounded-xl px-3 py-2 text-sm bg-white font-medium text-slate-700"
            >
              {CATEGORIAS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "Todos" ? "Todas las categorías" : cat}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setSoloOfertas(!soloOfertas)}
              className={`text-xs font-bold px-3 py-2 rounded-xl border transition-all ${
                soloOfertas
                  ? "bg-rose-50 border-rose-300 text-rose-700 shadow-inner"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              🔥 Solo Ofertas ({productos.filter((p) => p.en_oferta).length})
            </button>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200 self-end lg:self-auto">
            <button
              type="button"
              onClick={() => setVistaGaleria(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                vistaGaleria ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              🖼️ Galería Visual
            </button>
            <button
              type="button"
              onClick={() => setVistaGaleria(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                !vistaGaleria ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              📋 Tabla Detallada
            </button>
          </div>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        {cargando ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500 font-semibold animate-pulse">Cargando catálogo de productos...</p>
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <div className="text-4xl mb-3">📦</div>
            <h3 className="text-base font-bold text-slate-800">No se encontraron productos</h3>
            <p className="text-slate-400 text-xs mt-1">Probá con otro término de búsqueda o categoría.</p>
          </div>
        ) : vistaGaleria ? (
          /* MODO GALERÍA VISUAL */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {productosFiltrados.map((prod) => {
              const badgeStyle = ESTILOS_BADGE[prod.color_oferta || "rojo"] || ESTILOS_BADGE.rojo;
              const stock = prod.existencia ?? 0;
              const stockBajo = stock <= (prod.stock_minimo ?? 0);

              return (
                <div
                  key={prod.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between relative group"
                >
                  {prod.en_oferta && (
                    <span
                      style={{ background: badgeStyle.bg, color: badgeStyle.color }}
                      className="absolute top-3 right-3 text-[10px] font-black px-2.5 py-1 rounded-lg shadow z-10 uppercase tracking-wide"
                    >
                      {prod.texto_oferta || "OFERTA"}
                    </span>
                  )}

                  <div>
                    <div className="w-full h-48 bg-slate-100 flex items-center justify-center overflow-hidden border-b border-slate-100">
                      {prod.imagen_url ? (
                        <img
                          src={prod.imagen_url}
                          alt={prod.nombre}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="text-center text-slate-300">
                          <div className="text-3xl mb-1">🎁</div>
                          <span className="text-[11px] font-semibold">Sin imagen</span>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider truncate">
                          {prod.categoria || prod.rubro || "Librería"}
                          {prod.subcategoria ? ` • ${prod.subcategoria}` : ""}
                        </span>
                        
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            stockBajo ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          Stock: {stock}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 line-clamp-2 min-h-[40px]" title={prod.nombre}>
                        {prod.nombre}
                      </h3>

                      <div className="mt-2 flex items-baseline justify-between">
                        <span className="text-xl font-black text-slate-900">
                          ${prod.precio?.toLocaleString("es-AR")}
                        </span>
                        {/* COSTO VISIBLE SOLO PARA ADMIN */}
                        {esAdmin && prod.precio_costo ? (
                          <span className="text-xs text-slate-400 font-medium">
                            Costo: ${prod.precio_costo.toLocaleString("es-AR")}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <button
                      type="button"
                      onClick={() => handleToggleOferta(prod)}
                      className={`w-full mb-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors border ${
                        prod.en_oferta
                          ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {prod.en_oferta ? "🔥 En Oferta (quitar)" : "☆ Marcar Oferta"}
                    </button>

                    <div className={`grid ${esAdmin ? "grid-cols-3" : "grid-cols-2"} gap-1.5`}>
                      <Link
                        href={`/admin/productos/editar/${prod.id}`}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 py-1.5 px-1 rounded-lg text-xs font-bold transition-colors text-center"
                      >
                        ✏️ Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => duplicarProducto(prod)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 px-1 rounded-lg text-xs font-bold transition-colors"
                        title="Duplicar variante"
                      >
                        📋 Clonar
                      </button>
                      {/* BOTÓN BORRAR SOLO PARA ADMIN */}
                      {esAdmin && (
                        <button
                          type="button"
                          onClick={() => handleEliminar(prod.id, prod.nombre)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 py-1.5 px-1 rounded-lg text-xs font-bold transition-colors"
                        >
                          🗑️ Borrar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* MODO TABLA COMPACTA */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
                <tr>
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-4">Categoría / Subcategoría</th>
                  <th className="py-3 px-4">Precio Venta</th>
                  {esAdmin && <th className="py-3 px-4">Costo</th>}
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Promo</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productosFiltrados.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-200">
                        {prod.imagen_url ? (
                          <img src={prod.imagen_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>📦</span>
                        )}
                      </div>
                      <span className="font-bold text-slate-900">{prod.nombre}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs font-medium">
                      {prod.categoria || prod.rubro || "Librería"}
                      {prod.subcategoria ? ` › ${prod.subcategoria}` : ""}
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900">
                      ${prod.precio?.toLocaleString("es-AR")}
                    </td>
                    {esAdmin && (
                      <td className="py-3 px-4 text-slate-400 text-xs">
                        ${prod.precio_costo ? prod.precio_costo.toLocaleString("es-AR") : "0"}
                      </td>
                    )}
                    <td className="py-3 px-4">
                      <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                        {prod.existencia ?? 0}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleOferta(prod)}
                        className={`text-xs font-bold px-2.5 py-1 rounded-full border transition-colors ${
                          prod.en_oferta
                            ? "bg-rose-100 text-rose-800 border-rose-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        {prod.en_oferta ? "🔥 En Oferta" : "Normal"}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <Link
                        href={`/admin/productos/editar/${prod.id}`}
                        className="inline-block bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => duplicarProducto(prod)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                      >
                        Clonar
                      </button>
                      {esAdmin && (
                        <button
                          type="button"
                          onClick={() => handleEliminar(prod.id, prod.nombre)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors"
                        >
                          Eliminar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </main>
  );
}