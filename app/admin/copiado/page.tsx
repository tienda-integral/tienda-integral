"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Tarifa {
  id: number;
  tipo: string;
  categoria_servicio: string;
  precio_unitario: number;
  descripcion?: string;
  activo: boolean;
}

export default function AdminCopiadoPage() {
  const router = useRouter();
  const [tarifas, setTarifas] = useState<Tarifa[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardandoId, setGuardandoId] = useState<number | null>(null);

  const [nuevoTipo, setNuevoTipo] = useState("");
  const [nuevaCat, setNuevaCat] = useState("Impresión");
  const [nuevoPrecio, setNuevoPrecio] = useState("");
  const [nuevaDesc, setNuevaDesc] = useState("");

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

      cargarTarifas();
    }

    verificarYcargar();
  }, [router]);

  const cargarTarifas = async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from("tarifas_copiado")
      .select("*")
      .order("id", { ascending: true });

    if (!error && data) {
      setTarifas(data);
    }
    setCargando(false);
  };

  const handleActualizarPrecio = async (id: number, nuevoPrecioVal: number) => {
    setGuardandoId(id);
    const { error } = await supabase
      .from("tarifas_copiado")
      .update({ precio_unitario: nuevoPrecioVal })
      .eq("id", id);

    if (error) {
      alert("Error al actualizar precio: " + error.message);
    } else {
      setTarifas((prev) =>
        prev.map((t) => (t.id === id ? { ...t, precio_unitario: nuevoPrecioVal } : t))
      );
    }
    setGuardandoId(null);
  };

  const handleToggleActivo = async (tarifa: Tarifa) => {
    const nuevoEstado = !tarifa.activo;
    const { error } = await supabase
      .from("tarifas_copiado")
      .update({ activo: nuevoEstado })
      .eq("id", tarifa.id);

    if (!error) {
      setTarifas((prev) =>
        prev.map((t) => (t.id === tarifa.id ? { ...t, activo: nuevoEstado } : t))
      );
    }
  };

  const handleCrearTarifa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoTipo || !nuevoPrecio) return;

    const { data, error } = await supabase
      .from("tarifas_copiado")
      .insert([
        {
          tipo: nuevoTipo.trim(),
          categoria_servicio: nuevaCat,
          precio_unitario: parseFloat(nuevoPrecio),
          descripcion: nuevaDesc.trim(),
          activo: true,
        },
      ])
      .select();

    if (error) {
      alert("Error al crear tarifa: " + error.message);
    } else if (data) {
      setTarifas((prev) => [...prev, data[0]]);
      setNuevoTipo("");
      setNuevoPrecio("");
      setNuevaDesc("");
    }
  };

  const handleEliminarTarifa = async (id: number, tipo: string) => {
    if (!confirm(`¿Eliminar la tarifa "${tipo}"?`)) return;

    const { error } = await supabase.from("tarifas_copiado").delete().eq("id", id);
    if (!error) {
      setTarifas((prev) => prev.filter((t) => t.id !== id));
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🖨️</span>
              <h1 className="text-2xl font-black text-slate-900">Tarifario de Copiado e Impresiones</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Controlá el valor de copias, tipos de papel, anillados y plastificados en tiempo real.
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
              className="bg-blue-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-xs"
            >
              🖨️ Copiado
            </Link>
            <Link
              href="/tienda/copiado"
              target="_blank"
              className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors border border-emerald-200"
            >
              Ver Calculadora Pública ↗
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs h-fit">
            <h2 className="text-base font-black text-slate-900 mb-1 flex items-center gap-2">
              <span>+</span> Nueva Tarifa
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Agregá un nuevo ítem a la lista de servicios.
            </p>

            <form onSubmit={handleCrearTarifa} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Categoría
                </label>
                <select
                  value={nuevaCat}
                  onChange={(e) => setNuevaCat(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 font-medium"
                >
                  <option value="Impresión">Impresión / Copiado</option>
                  <option value="Terminación">Terminación / Anillado</option>
                  <option value="Plastificado">Plastificado</option>
                  <option value="Papel Especial">Papel Especial (Ilustración / Opalina)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Nombre del Servicio
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Oficio Color Simple Faz"
                  value={nuevoTipo}
                  onChange={(e) => setNuevoTipo(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Precio Unitario ($)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="ej. 80"
                  value={nuevoPrecio}
                  onChange={(e) => setNuevoPrecio(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Descripción Breve
                </label>
                <input
                  type="text"
                  placeholder="ej. Papel obra 80g"
                  value={nuevaDesc}
                  onChange={(e) => setNuevaDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-xs"
              >
                Guardar Tarifa
              </button>
            </form>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Listado de Tarifas ({tarifas.length})
                </span>
                <span className="text-[11px] text-slate-400">
                  Editá el precio directo en el casillero
                </span>
              </div>

              {cargando ? (
                <div className="p-12 text-center text-slate-400 text-xs font-bold animate-pulse">
                  Cargando tarifas...
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {tarifas.map((t) => (
                    <div
                      key={t.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{t.tipo}</span>
                          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
                            {t.categoria_servicio}
                          </span>
                          {!t.activo && (
                            <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              Pausado
                            </span>
                          )}
                        </div>
                        {t.descripcion && (
                          <p className="text-xs text-slate-400 mt-0.5">{t.descripcion}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200">
                          <span className="text-xs font-black text-slate-500">$</span>
                          <input
                            type="number"
                            defaultValue={t.precio_unitario}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val) && val !== t.precio_unitario) {
                                handleActualizarPrecio(t.id, val);
                              }
                            }}
                            className="w-20 font-black text-slate-900 text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                          />
                          {guardandoId === t.id && (
                            <span className="text-[10px] text-blue-600 animate-pulse font-bold">
                              ✓
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleActivo(t)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition-colors ${
                            t.activo
                              ? "bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {t.activo ? "Pausar" : "Activar"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEliminarTarifa(t.id, t.tipo)}
                          className="text-slate-300 hover:text-rose-600 transition-colors p-1"
                          title="Eliminar"
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