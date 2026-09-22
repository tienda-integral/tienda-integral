"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface ProveedorOption {
  id: string;
  razon_social: string;
  nombre_fantasia: string | null;
}

const ESTRUCTURA_RUBROS: Record<string, string[]> = {
  "Librería": ["Escolar", "Técnica", "Comercial", "Artística"],
  "Descartables": ["Vasos y Platos", "Bolsas", "Cajas y Embalaje", "Papelería"],
  "Cotillón": ["Cumpleaños", "Fiestas Temáticas", "Globología", "Repostería"],
  "Regalería": ["Bazar", "Accesorios", "Velas y Aromas", "Tarjetas"],
  "Juguetería": ["Primera Infancia", "Juegos de Mesa", "Didácticos", "Aire Libre"],
};

const SUGERENCIAS_RAPIDAS: Record<string, string[]> = {
  "Librería": ["Tapa dura", "Hojas rayadas", "Hojas cuadriculadas", "Tinta gel", "Punta fina"],
  "Descartables": ["Pack x10", "Pack x50", "Biodegradable", "Reforzado"],
  "Cotillón": ["Multicolor", "Metalizado", "Cumpleaños", "Especial Eventos"],
  "Regalería": ["Diseño exclusivo", "Ideal regalo", "Aromático", "Colección"],
  "Juguetería": ["+3 años", "Juego en familia", "Didáctico", "Estimulación temprana"],
};

const ESTILOS_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  rojo: { bg: "#ef4444", color: "#ffffff", label: "🔴 Promo Fuerte" },
  amarillo: { bg: "#facc15", color: "#854d0e", label: "🟡 Liquidación" },
  verde: { bg: "#10b981", color: "#ffffff", label: "🟢 Nuevo Ingreso" },
  violeta: { bg: "#8b5cf6", color: "#ffffff", label: "🟣 Especial Regalo" },
};

export default function NuevoProductoPage() {
  const [proveedores, setProveedores] = useState<ProveedorOption[]>([]);
  const [cargandoProveedores, setCargandoProveedores] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [subiendoImg, setSubiendoImg] = useState(false);

  // Estados visuales e interactivos
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState(Object.keys(ESTRUCTURA_RUBROS)[0]);
  const [subcategoria, setSubcategoria] = useState(ESTRUCTURA_RUBROS[Object.keys(ESTRUCTURA_RUBROS)[0]][0]);
  const [precio, setPrecio] = useState<number | "">("");
  const [imagenUrl, setImagenUrl] = useState("");
  const [enOferta, setEnOferta] = useState(false);
  const [textoOferta, setTextoOferta] = useState("");
  const [colorOferta, setColorOferta] = useState("rojo");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function obtenerProveedores() {
      const { data, error } = await supabase
        .from("proveedores")
        .select("id, razon_social, nombre_fantasia")
        .eq("activo", true)
        .order("razon_social", { ascending: true });

      if (!error && data) {
        setProveedores(data);
      }
      setCargandoProveedores(false);
    }

    obtenerProveedores();
  }, []);

  const handleCategoriaChange = (nuevaCat: string) => {
    setCategoria(nuevaCat);
    setSubcategoria(ESTRUCTURA_RUBROS[nuevaCat]?.[0] || "");
  };

  const subirArchivo = async (file: File) => {
    try {
      setSubiendoImg(true);
      const ext = file.name.split(".").pop();
      const nombreArchivo = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
      const { error } = await supabase.storage.from("productos").upload(nombreArchivo, file);

      if (error) {
        const reader = new FileReader();
        reader.onload = (e) => setImagenUrl(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        const { data: publicData } = supabase.storage.from("productos").getPublicUrl(nombreArchivo);
        setImagenUrl(publicData.publicUrl);
      }
    } finally {
      setSubiendoImg(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.[0]) subirArchivo(e.dataTransfer.files[0]);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) subirArchivo(file);
        }
      }
    }
  };

  async function guardarProducto(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGuardando(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/productos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          codigo_interno: formData.get("codigo_interno"),
          codigo_barras: formData.get("codigo_barras"),
          nombre,
          marca: formData.get("marca"),
          proveedor: formData.get("proveedor"),
          categoria,
          subcategoria,
          precio_costo: Number(formData.get("precio_costo")) || 0,
          precio: Number(precio) || 0,
          existencia: Number(formData.get("existencia")) || 0,
          stock_minimo: Number(formData.get("stock_minimo")) || 0,
          descripcion: formData.get("descripcion"),
          imagen_url: imagenUrl,
          en_oferta: enOferta,
          texto_oferta: enOferta ? textoOferta || "OFERTA" : null,
          color_oferta: enOferta ? colorOferta : "rojo",
        }),
      });

      const data = await response.json().catch(() => null);
      setGuardando(false);

      if (response.ok) {
        alert("✨ ¡Producto guardado y publicado correctamente!");
        form.reset();
        setNombre("");
        setPrecio("");
        setImagenUrl("");
        setEnOferta(false);
        setTextoOferta("");
      } else {
        const errorMsg = data?.error || `Error del servidor (Estado: ${response.status})`;
        alert("Error al guardar: " + errorMsg);
      }
    } catch (err: unknown) {
      setGuardando(false);
      const msg = err instanceof Error ? err.message : "Error de red";
      alert("Error de conexión: " + msg);
    }
  }

  const badgeActual = ESTILOS_BADGE[colorOferta] || ESTILOS_BADGE.rojo;

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans" onPaste={handlePaste}>
      <div className="max-w-7xl mx-auto mb-8 flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Estudio Creativo: Nuevo Producto</h1>
          <p className="text-slate-500 text-sm mt-1">Cargá datos comerciales y diseñá la presencia del producto en tiempo real.</p>
        </div>
        <Link
          href="/admin/productos"
          className="text-slate-600 hover:text-slate-900 font-semibold text-sm bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors"
        >
          ← Volver a la lista
        </Link>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* FORMULARIO */}
        <form
          onSubmit={guardarProducto}
          className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-sm p-8"
        >
          {/* FOTO: DRAG AND DROP / PASTE */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-6 text-center bg-slate-50 hover:bg-blue-50/40 cursor-pointer transition-colors mb-6"
          >
            <input
              type="file"
              ref={fileInputRef}
              hidden
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && subirArchivo(e.target.files[0])}
            />
            <div className="text-3xl mb-2">📸</div>
            <p className="font-semibold text-slate-700 text-sm">
              {subiendoImg ? "Subiendo foto..." : "Arrastrá la foto acá, hacé clic o pegá con Ctrl + V"}
            </p>
            <p className="text-xs text-slate-400 mt-1">Podés cargar archivo o ingresar enlace directo abajo</p>
          </div>

          <div className="mb-4">
            <label className="block mb-1 text-xs font-semibold text-slate-500">URL de Imagen (Opcional si ya subiste archivo)</label>
            <input
              type="text"
              value={imagenUrl}
              onChange={(e) => setImagenUrl(e.target.value)}
              placeholder="https://..."
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
            />
          </div>

          {/* NOMBRE DEL PRODUCTO */}
          <div className="mb-2">
            <label className="block mb-1 font-bold text-slate-800">Nombre del Producto *</label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Cuaderno A4 Tapa Dura Rayado"
              className="w-full border border-slate-300 rounded-lg p-3 text-base font-medium focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* SUGERENCIAS RÁPIDAS */}
          <div className="mb-6">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Inspiración rápida para el título:</span>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {SUGERENCIAS_RAPIDAS[categoria]?.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setNombre((prev) => (prev ? `${prev} - ${sug}` : sug))}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs px-2.5 py-1 rounded-full font-medium transition-colors"
                >
                  + {sug}
                </button>
              ))}
            </div>
          </div>

          {/* CÓDIGOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-1 font-semibold text-sm text-slate-700">Código Interno</label>
              <input
                name="codigo_interno"
                type="text"
                placeholder="Ej: ART-001"
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-sm text-slate-700">Código de Barras</label>
              <input
                name="codigo_barras"
                type="text"
                placeholder="Ej: 7791234567890"
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
              />
            </div>
          </div>

          {/* CATEGORÍA Y SUBCATEGORÍA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-1 font-semibold text-sm text-slate-700">Categoría</label>
              <select
                value={categoria}
                onChange={(e) => handleCategoriaChange(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white"
              >
                {Object.keys(ESTRUCTURA_RUBROS).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-semibold text-sm text-slate-700">Subcategoría</label>
              <select
                value={subcategoria}
                onChange={(e) => setSubcategoria(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white"
              >
                {ESTRUCTURA_RUBROS[categoria]?.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>

          {/* MARCA Y PROVEEDOR */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-1 font-semibold text-sm text-slate-700">Marca</label>
              <input
                name="marca"
                type="text"
                placeholder="Ej: Rivadavia / Mooving"
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-sm text-slate-700">Proveedor Asignado</label>
              <select
                name="proveedor"
                defaultValue=""
                disabled={cargandoProveedores}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white"
              >
                <option value="">
                  {cargandoProveedores ? "Cargando proveedores..." : "-- Seleccionar Proveedor --"}
                </option>
                {proveedores.map((prov) => (
                  <option key={prov.id} value={prov.razon_social}>
                    {prov.nombre_fantasia ? `${prov.razon_social} (${prov.nombre_fantasia})` : prov.razon_social}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* PRECIOS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block mb-1 font-semibold text-sm text-slate-700">Precio Costo ($)</label>
              <input
                name="precio_costo"
                type="number"
                step="0.01"
                defaultValue={0}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block mb-1 font-bold text-sm text-slate-900">Precio Venta ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={precio}
                onChange={(e) => setPrecio(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="0.00"
                className="w-full border border-slate-300 rounded-lg p-2.5 text-base font-bold text-emerald-600 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* EXISTENCIAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block mb-1 font-semibold text-sm text-slate-700">Existencia (Stock)</label>
              <input
                name="existencia"
                type="number"
                defaultValue={0}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-sm text-slate-700">Stock Mínimo</label>
              <input
                name="stock_minimo"
                type="number"
                defaultValue={0}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
              />
            </div>
          </div>

          {/* OFERTAS Y BADGES */}
          <div className={`p-5 rounded-xl border mb-6 transition-colors ${enOferta ? "bg-rose-50 border-rose-200" : "bg-slate-50 border-slate-200"}`}>
            <label className="flex items-center gap-3 cursor-pointer font-bold text-slate-800 text-sm">
              <input
                type="checkbox"
                checked={enOferta}
                onChange={(e) => setEnOferta(e.target.checked)}
                className="w-5 h-5 accent-rose-600 rounded"
              />
              🔥 Destacar como Oferta o Promoción en la Tienda
            </label>

            {enOferta && (
              <div className="mt-4 pt-4 border-t border-rose-200/60">
                <label className="block mb-1 text-xs font-bold text-slate-700">Texto del distintivo:</label>
                <input
                  type="text"
                  placeholder="Ej: 20% OFF en Efectivo"
                  value={textoOferta}
                  onChange={(e) => setTextoOferta(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white mb-3"
                />

                <span className="block text-xs font-bold text-slate-700 mb-2">Color del distintivo:</span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(ESTILOS_BADGE).map(([key, style]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setColorOferta(key)}
                      style={{ background: style.bg, color: style.color }}
                      className={`text-xs px-3 py-1.5 rounded-full font-bold shadow-sm transition-transform ${colorOferta === key ? "ring-2 ring-slate-900 scale-105" : "opacity-80"}`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="block mb-1 font-semibold text-sm text-slate-700">Descripción / Observaciones</label>
            <textarea
              name="descripcion"
              rows={3}
              placeholder="Detalles técnicos, presentación, colores disponibles..."
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={guardando}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow hover:shadow-md disabled:opacity-50 text-base"
          >
            {guardando ? "Guardando..." : "Publicar Producto en Catálogo"}
          </button>
        </form>

        {/* PREVIEW EN VIVO */}
        <aside className="lg:col-span-5 sticky top-8 flex flex-col items-center">
          <span className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-3">
            Vista previa en tiempo real
          </span>

          <div className="w-full max-w-xs bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-xl relative">
            {enOferta && (
              <span
                style={{ background: badgeActual.bg, color: badgeActual.color }}
                className="absolute top-3 right-3 text-xs font-extrabold px-3 py-1 rounded-lg shadow-md z-10"
              >
                {textoOferta || "OFERTA"}
              </span>
            )}

            <div className="w-full h-64 bg-slate-100 flex items-center justify-center overflow-hidden">
              {imagenUrl ? (
                <img src={imagenUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-slate-400">
                  <div className="text-4xl mb-1">📦</div>
                  <span className="text-xs font-semibold">Sin imagen cargada</span>
                </div>
              )}
            </div>

            <div className="p-5">
              <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wide">
                {categoria} • {subcategoria}
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1 min-h-[44px]">
                {nombre || "Título del producto..."}
              </h3>
              <div className="flex justify-between items-center mt-3">
                <span className="text-2xl font-black text-slate-900">
                  ${precio ? Number(precio).toLocaleString("es-AR") : "0"}
                </span>
                <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-sm">
                  Agregar
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}