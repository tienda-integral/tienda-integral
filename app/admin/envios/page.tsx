"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface ZonaEnvio {
  id: number;
  zona: string;
  costo: number;
  tiempo_estimado?: string;
  activo: boolean;
}

export default function AdminEnviosPage() {
  const router = useRouter();
  const [zonas, setZonas] = useState<ZonaEnvio[]>([]);
  const [cargando, setCargando] = useState(true);

  // Parámetros generales
  const [minimoEnvioGratis, setMinimoEnvioGratis] = useState<string>("25000");
  const [whatsappPedidos, setWhatsappPedidos] = useState<string>("");
  const [descuentoEfectivo, setDescuentoEfectivo] = useState<string>("10");
  const [guardandoAjustes, setGuardandoAjustes] = useState(false);

  // Formulario nueva zona
  const [nuevaZona, setNuevaZona] = useState("");
  const [nuevoCosto, setNuevoCosto] = useState("");
  const [nuevoTiempo, setNuevoTiempo] = useState("24 a 48 hs");

  useEffect(() => {
    async function verificarYcargar() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: perfil } = await supabase
        .from("perfiles")
        .select("rol")
        .eq("id", user.id)
        .maybeSingle();

      if (!perfil || perfil.rol === "cliente") {
        router.push("/login");
        return;
      }

      cargarDatos();
    }

    verificarYcargar();
  }, [router]);

  const cargarDatos = async () => {
    setCargando(true);
    
    // 1. Zonas de envío
    const { data: zonasData } = await supabase
      .from("config_envios")
      .select("*")
      .order("id", { ascending: true });

    if (zonasData) setZonas(zonasData);

    // 2. Parámetros de la tienda
    const { data: ajustesData } = await supabase
      .from("ajustes_tienda")
      .select("*");

    if (ajustesData) {
      ajustesData.forEach((item) => {
        if (item.clave === "monto_minimo_envio_gratis") setMinimoEnvioGratis(item.valor);
        if (item.clave === "whatsapp_pedidos") setWhatsappPedidos(item.valor);
        if (item.clave === "descuento_efectivo_porcentaje") setDescuentoEfectivo(item.valor);
      });
    }

    setCargando(false);
  };

  const handleGuardarAjustesGenerales = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoAjustes(true);

    const updates = [
      { clave: "monto_minimo_envio_gratis", valor: minimoEnvioGratis },
      { clave: "whatsapp_pedidos", valor: whatsappPedidos },
      { clave: "descuento_efectivo_porcentaje", valor: descuentoEfectivo },
    ];

    const { error } = await supabase.from("ajustes_tienda").upsert(updates);

    if (error) {
      alert("Error al guardar ajustes: " + error.message);
    } else {
      alert("¡Ajustes comerciales actualizados con éxito!");
    }
    setGuardandoAjustes(false);
  };

  const handleActualizarCostoZona = async (id: number, nuevoCostoVal: number) => {
    const { error } = await supabase
      .from("config_envios")
      .update({ costo: nuevoCostoVal })
      .eq("id", id);

    if (!error) {
      setZonas((prev) =>
        prev.map((z) => (z.id === id ? { ...z, costo: nuevoCostoVal } : z))
      );
    }
  };

  const handleToggleZona = async (zona: ZonaEnvio) => {
    const nuevoEstado = !zona.activo;
    const { error } = await supabase
      .from("config_envios")
      .update({ activo: nuevoEstado })
      .eq("id", zona.id);

    if (!error) {
      setZonas((prev) =>
        prev.map((z) => (z.id === zona.id ? { ...z, activo: nuevoEstado } : z))
      );
    }
  };

  const handleCrearZona = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaZona || !nuevoCosto) return;

    const { data, error } = await supabase
      .from("config_envios")
      .insert([
        {
          zona: nuevaZona.trim(),
          costo: parseFloat(nuevoCosto),
          tiempo_estimado: nuevoTiempo.trim(),
          activo: true,
        },
      ])
      .select();

    if (error) {
      alert("Error al agregar zona: " + error.message);
    } else if (data) {
      setZonas((prev) => [...prev, data[0]]);
      setNuevaZona("");
      setNuevoCosto("");
      setNuevoTiempo("24 a 48 hs");
    }
  };

  const handleEliminarZona = async (id: number, nombre: string) => {
    if (!confirm(`¿Eliminar la zona "${nombre}"?`)) return;

    const { error } = await supabase.from("config_envios").delete().eq("id", id);
    if (!error) {
      setZonas((prev) => prev.filter((z) => z.id !== id));
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto">
        
        {/* NAVEGACIÓN ADMINISTRATIVA */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🚚</span>
              <h1 className="text-2xl font-black text-slate-900">Envíos y Parámetros Comerciales</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Definí costos por zona, envío gratis y descuentos por pago al contado.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/admin/productos"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors"
            >
              📦 Productos
            </Link>
            <Link
              href="/admin/categorias"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors"
            >
              🏷️ Categorías
            </Link>
            <Link
              href="/admin/copiado"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors"
            >
              🖨️ Copiado
            </Link>
            <Link
              href="/admin/envios"
              className="bg-blue-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-xs"
            >
              🚚 Envíos
            </Link>
            <Link
              href="/tienda"
              target="_blank"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors"
            >
              Tienda ↗
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* PANEL IZQUIERDO: REGLAS GENERALES Y NUEVA ZONA */}
          <div className="space-y-6">
            
            {/* REGLAS COMERCIALES DE TIENDA */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="text-base font-black text-slate-900 mb-1 flex items-center gap-2">
                <span>⚙️</span> Reglas Comerciales
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                Condiciones que impactan directamente en el carrito y la tienda.
              </p>

              <form onSubmit={handleGuardarAjustesGenerales} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Monto Mínimo para Envío Gratis ($)
                  </label>
                  <input
                    type="number"
                    value={minimoEnvioGratis}
                    onChange={(e) => setMinimoEnvioGratis(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500"
                    placeholder="25000"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Compras iguales o superiores tendrán flete bonificado.
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    % Descuento Efectivo / Transf.
                  </label>
                  <input
                    type="number"
                    value={descuentoEfectivo}
                    onChange={(e) => setDescuentoEfectivo(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500"
                    placeholder="10"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    WhatsApp para Pedidos (con código país)
                  </label>
                  <input
                    type="text"
                    value={whatsappPedidos}
                    onChange={(e) => setWhatsappPedidos(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500 font-mono"
                    placeholder="ej. 5491112345678"
                  />
                </div>

                <button
                  type="submit"
                  disabled={guardandoAjustes}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-xs"
                >
                  {guardandoAjustes ? "Guardando..." : "Guardar Reglas"}
                </button>
              </form>
            </div>

            {/* FORMULARIO NUEVA ZONA */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
              <h2 className="text-base font-black text-slate-900 mb-1 flex items-center gap-2">
                <span>+</span> Nueva Zona de Envío
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                Creá una tarifa fija por barrio, localidad o correo.
              </p>

              <form onSubmit={handleCrearZona} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Nombre de Zona / Cobertura
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Zona Norte / Envío Expreso"
                    value={nuevaZona}
                    onChange={(e) => setNuevaZona(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Costo de Envío ($)
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0 para retiro o monto en pesos"
                    value={nuevoCosto}
                    onChange={(e) => setNuevoCosto(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Tiempo de Entrega Estimado
                  </label>
                  <input
                    type="text"
                    placeholder="ej. Mismo día / 24 hs"
                    value={nuevoTiempo}
                    onChange={(e) => setNuevoTiempo(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-xs"
                >
                  Agregar Zona
                </button>
              </form>
            </div>

          </div>

          {/* PANEL DERECHO: LISTADO DE ZONAS CONFIGURADAS */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Zonas y Tarifas Activas ({zonas.length})
                </span>
                <span className="text-[11px] text-slate-400">
                  Modificá el precio directo en el casillero
                </span>
              </div>

              {cargando ? (
                <div className="p-12 text-center text-slate-400 text-xs font-bold animate-pulse">
                  Cargando tarifas de envío...
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {zonas.map((z) => (
                    <div
                      key={z.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{z.zona}</span>
                          {!z.activo && (
                            <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              Pausada
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          ⏱️ Plazo: {z.tiempo_estimado || "A coordinar"}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200">
                          <span className="text-xs font-black text-slate-500">$</span>
                          <input
                            type="number"
                            defaultValue={z.costo}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val) && val !== z.costo) {
                                handleActualizarCostoZona(z.id, val);
                              }
                            }}
                            className="w-20 font-black text-slate-900 text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleZona(z)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                            z.activo
                              ? "bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {z.activo ? "Pausar" : "Activar"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEliminarZona(z.id, z.zona)}
                          className="text-slate-300 hover:text-rose-600 transition-colors p-1"
                          title="Eliminar zona"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}