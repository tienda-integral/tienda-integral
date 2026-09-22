"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Producto {
  id: number;
  nombre: string;
  precio: number;
  categoria?: string;
  rubro?: string;
  subcategoria?: string;
  imagen_url?: string;
  existencia?: number;
  en_oferta?: boolean;
  texto_oferta?: string;
  color_oferta?: string;
}

const CATEGORIAS = [
  "Todos",
  "Librería",
  "Descartables",
  "Cotillón",
  "Regalería",
  "Juguetería",
];

const ESTILOS_BADGE: Record<string, { bg: string; color: string }> = {
  rojo: { bg: "#ef4444", color: "#ffffff" },
  amarillo: { bg: "#facc15", color: "#854d0e" },
  verde: { bg: "#10b981", color: "#ffffff" },
  violeta: { bg: "#8b5cf6", color: "#ffffff" },
};

export default function TiendaPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");
  const [soloOfertas, setSoloOfertas] = useState(false);

  useEffect(() => {
    async function fetchProductos() {
      setCargando(true);
      const { data, error } = await supabase
        .from("productos")
        .select("*")
        .order("id", { ascending: false });

      if (!error && data) {
        setProductos(data);
      }
      setCargando(false);
    }
    fetchProductos();
  }, []);

  const productosFiltrados = productos.filter((prod) => {
    const coincideTexto = prod.nombre?.toLowerCase().includes(busqueda.toLowerCase());
    const cat = (prod.categoria || prod.rubro || "").toLowerCase();
    const coincideCat =
      categoriaActiva === "Todos" || cat.includes(categoriaActiva.toLowerCase());
    const coincideOferta = !soloOfertas || Boolean(prod.en_oferta);
    return coincideTexto && coincideCat && coincideOferta;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      
      {/* 1. CINTA DE BENEFICIOS ULTRA COMPACTA */}
      <div className="bg-slate-900 text-white text-[11px] py-1.5 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="bg-blue-600 font-black px-1.5 py-0.2 text-[9px] rounded">BNA+</span>
              <span className="text-slate-300">Hasta <strong>3 cuotas sin interés</strong></span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <span className="bg-[#009ee3] font-black px-1.5 py-0.2 text-[9px] rounded">MP</span>
              <span className="text-slate-300">Aceptamos <strong>Mercado Pago</strong></span>
            </div>
            <div className="hidden md:flex items-center gap-1 text-emerald-400 font-semibold">
              <span>💵 10% OFF Efectivo / Transferencia</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            <Link
              href="/tienda/copiado"
              className="hover:text-emerald-400 text-emerald-300 font-bold transition-colors"
            >
              🖨️ Centro de Impresión
            </Link>
            <span>•</span>
            <Link href="/institucional" className="hover:text-amber-400 text-amber-300 font-bold transition-colors">
              🏫 Escuelas
            </Link>
            <span>•</span>
            <Link href="/login" className="hover:text-white transition-colors">
              Equipo 🔐
            </Link>
          </div>
        </div>
      </div>

      {/* 2. ENCABEZADO COMPACTO */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-sm">
              M
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">
                MAKTUB
              </h1>
              <p className="text-[10px] font-bold text-blue-600 tracking-wider uppercase">
                Librería • Cotillón • Regalería
              </p>
            </div>
          </div>

          <div className="w-full sm:w-80 relative">
            <input
              type="text"
              placeholder="Buscar productos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
            <span className="absolute left-2.5 top-2 text-slate-400 text-xs">🔍</span>
          </div>
        </div>

        {/* Categorías deslizables */}
        <div className="bg-slate-50 border-t border-slate-100 px-4">
          <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto py-1.5 no-scrollbar">
            {CATEGORIAS.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoriaActiva(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  categoriaActiva === cat
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setSoloOfertas(!soloOfertas)}
              className={`ml-auto px-3 py-1 rounded-lg text-xs font-black whitespace-nowrap transition-all border ${
                soloOfertas
                  ? "bg-rose-600 text-white border-rose-600"
                  : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
              }`}
            >
              🔥 Ofertas
            </button>
          </div>
        </div>
      </header>

      {/* 3. PASTILLAS INFORMATIVAS */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          
          {/* Pastilla Financiación */}
          <div className="md:col-span-2 bg-gradient-to-r from-blue-700 to-indigo-700 rounded-2xl p-4 text-white shadow-xs flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-white/20 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Financiación
                </span>
                <span className="text-xs text-blue-200 font-medium">Tarjetas & QR</span>
              </div>
              <h2 className="text-base sm:text-lg font-black leading-tight">
                Hasta 3 Cuotas Sin Interés con Banco Nación
              </h2>
              <p className="text-blue-100 text-xs mt-0.5">
                Aceptamos Mercado Pago, débito, crédito y transferencias bancarias.
              </p>
            </div>

            <div className="hidden sm:flex flex-col gap-1.5 shrink-0">
              <div className="bg-white rounded-lg px-2.5 py-1 text-center shadow-xs">
                <span className="text-blue-900 font-black text-[11px]">🏛️ BNA+</span>
              </div>
              <div className="bg-white rounded-lg px-2.5 py-1 text-center shadow-xs">
                <span className="text-[#009ee3] font-black text-[11px]">⚡ MERCADO PAGO</span>
              </div>
            </div>
          </div>

          {/* Pastilla Escuelas e Instituciones (Enlaza a /institucional con tu teléfono exclusivo) */}
          <div className="bg-amber-400 rounded-2xl p-4 text-slate-950 shadow-xs flex items-center justify-between gap-3">
            <div>
              <span className="bg-black/10 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                Escuelas & B2B
              </span>
              <h3 className="text-sm sm:text-base font-black leading-tight mt-1">
                Listas & Presupuestos
              </h3>
              <p className="text-slate-800 text-[11px] mt-0.5">
                Facturación oficial A/B y precios mayoristas.
              </p>
            </div>

            <Link
              href="/institucional"
              className="bg-slate-950 hover:bg-slate-900 text-white font-bold px-3 py-2 rounded-xl text-xs shrink-0 transition-all shadow-xs"
            >
              Cotizar ↗
            </Link>
          </div>

        </div>
      </div>

      {/* 4. CATÁLOGO DE PRODUCTOS */}
      <main className="max-w-7xl mx-auto px-4 py-5">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-base font-extrabold text-slate-900">
            {categoriaActiva === "Todos" ? "Catálogo de Productos" : categoriaActiva}
            <span className="ml-2 text-xs font-normal text-slate-500">
              ({productosFiltrados.length})
            </span>
          </h2>
        </div>

        {cargando ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-400 font-bold animate-pulse text-xs">
              Cargando catálogo...
            </p>
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <div className="text-3xl mb-1">🔍</div>
            <h3 className="font-bold text-slate-800 text-sm">No se encontraron productos</h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Probá con otra categoría o término de búsqueda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {productosFiltrados.map((prod) => {
              const badgeStyle = ESTILOS_BADGE[prod.color_oferta || "rojo"] || ESTILOS_BADGE.rojo;
              const cuota3 = Math.round((prod.precio || 0) / 3);

              return (
                <div
                  key={prod.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col justify-between group"
                >
                  <div className="relative">
                    {prod.en_oferta && (
                      <span
                        style={{ background: badgeStyle.bg, color: badgeStyle.color }}
                        className="absolute top-2 right-2 text-[9px] font-black px-2 py-0.5 rounded shadow-xs z-10 uppercase tracking-wider"
                      >
                        {prod.texto_oferta || "OFERTA"}
                      </span>
                    )}

                    <div className="w-full h-36 bg-slate-100 flex items-center justify-center overflow-hidden">
                      {prod.imagen_url ? (
                        <img
                          src={prod.imagen_url}
                          alt={prod.nombre}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <span className="text-2xl text-slate-300">🎁</span>
                      )}
                    </div>

                    <div className="p-3">
                      <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider block mb-0.5 truncate">
                        {prod.categoria || prod.rubro || "General"}
                        {prod.subcategoria ? ` • ${prod.subcategoria}` : ""}
                      </span>

                      <h3
                        className="text-xs font-bold text-slate-900 line-clamp-2 min-h-[32px] leading-snug"
                        title={prod.nombre}
                      >
                        {prod.nombre}
                      </h3>

                      <div className="mt-2">
                        <span className="text-base font-black text-slate-950 block leading-none">
                          ${prod.precio?.toLocaleString("es-AR")}
                        </span>
                        
                        <span className="text-[10px] font-semibold text-emerald-600 block mt-0.5">
                          3 cuotas de ${cuota3.toLocaleString("es-AR")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 pt-0">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(
                        `¡Hola Maktub! Me interesa comprar: ${prod.nombre} ($${prod.precio?.toLocaleString("es-AR")})`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full bg-slate-900 hover:bg-blue-600 text-white font-bold py-1.5 px-2 rounded-xl text-xs flex items-center justify-center gap-1 transition-colors"
                    >
                      <span>Pedir</span>
                      <span>💬</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 5. FOOTER */}
      <footer className="bg-white border-t border-slate-200 mt-10 py-6 text-center text-[11px] text-slate-400">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-bold text-slate-700 text-xs">MAKTUB • Librería, Cotillón y Regalería</p>
          <p className="mt-1">Pagos con BNA+, Mercado Pago, Tarjetas y Transferencias bancarias.</p>
        </div>
      </footer>

    </div>
  );
}