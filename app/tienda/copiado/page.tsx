"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Tarifa {
  id: number;
  tipo: string;
  categoria_servicio: string;
  precio_unitario: number;
  descripcion?: string;
  activo: boolean;
}

export default function TiendaCopiadoPage() {
  const [tarifas, setTarifas] = useState<Tarifa[]>([]);
  const [cargando, setCargando] = useState(true);

  // Control de paso: Solo avanza si hay archivo
  const [archivo, setArchivo] = useState<File | null>(null);

  // Opciones seleccionadas por el cliente
  const [tarifaSeleccionadaId, setTarifaSeleccionadaId] = useState<number | null>(null);
  const [paginas, setPaginas] = useState<number>(1);
  const [juegos, setJuegos] = useState<number>(1);
  const [anilladoId, setAnilladoId] = useState<number | "ninguno">("ninguno");
  const [plastificado, setPlastificado] = useState(false);
  const [aclaraciones, setAclaraciones] = useState("");

  useEffect(() => {
    async function fetchTarifas() {
      const { data } = await supabase
        .from("tarifas_copiado")
        .select("*")
        .eq("activo", true);

      if (data && data.length > 0) {
        setTarifas(data);
        const primeraImpresion = data.find((t) => t.categoria_servicio === "Impresión");
        if (primeraImpresion) setTarifaSeleccionadaId(primeraImpresion.id);
      }
      setCargando(false);
    }
    fetchTarifas();
  }, []);

  const impresionActual = tarifas.find((t) => t.id === tarifaSeleccionadaId);
  const anilladosDisponibles = tarifas.filter((t) => t.categoria_servicio === "Terminación");
  const tarifaPlastificado = tarifas.find((t) => t.categoria_servicio === "Plastificado");

  // Cálculos de presupuesto
  const precioPagina = impresionActual ? Number(impresionActual.precio_unitario) : 0;
  const subtotalHojas = precioPagina * (paginas || 0) * (juegos || 1);

  const costoAnillado =
    anilladoId !== "ninguno"
      ? Number(tarifas.find((t) => t.id === anilladoId)?.precio_unitario || 0) * (juegos || 1)
      : 0;

  const costoPlastificado =
    plastificado && tarifaPlastificado
      ? Number(tarifaPlastificado.precio_unitario) * (juegos || 1)
      : 0;

  const totalCalculado = subtotalHojas + costoAnillado + costoPlastificado;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArchivo(e.target.files[0]);
    }
  };

  const handleEnviarWhatsApp = () => {
    if (!impresionActual || !archivo) return;

    const texto = `Hola Maktub! Adjunto mi pedido de impresión:
📁 Archivo: ${archivo.name} (${(archivo.size / 1024 / 1024).toFixed(2)} MB)
📄 Tipo: ${impresionActual.tipo}
🔢 Páginas estimadas: ${paginas}
📚 Juegos: ${juegos}
${anilladoId !== "ninguno" ? `📎 Anillado: Sí (${tarifas.find((t) => t.id === anilladoId)?.tipo})\n` : ""}${plastificado ? `✨ Plastificado: Sí\n` : ""}${aclaraciones ? `📝 Nota: ${aclaraciones}\n` : ""}
Total estimado: $${totalCalculado.toLocaleString("es-AR")}
A continuación envío el archivo por este medio.`;

    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 py-3 px-4 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-sm">
              M
            </div>
            <span className="font-black text-slate-900 tracking-tight text-sm">
              MAKTUB • Centro de Impresión & Copiado
            </span>
          </div>
          <Link
            href="/tienda"
            className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
          >
            ← Volver a la Tienda
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* PASO 1: CARGA OBLIGATORIA DEL ARCHIVO */}
        {!archivo ? (
          <div className="max-w-xl mx-auto text-center py-10">
            <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
              Paso 1 Obligatorio
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-3">
              Cargá tu archivo para cotizar
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 mb-8">
              Subí tu documento (PDF, Word o imagen) para abrir las opciones de impresión, anillado y presupuesto en tiempo real.
            </p>

            <label className="border-2 border-dashed border-blue-400 hover:border-blue-600 bg-white hover:bg-blue-50/50 p-10 rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all shadow-xs group">
              <span className="text-5xl group-hover:scale-110 transition-transform mb-3">
                📄
              </span>
              <span className="text-sm font-black text-slate-800">
                Hacé clic aquí para seleccionar tu archivo
              </span>
              <span className="text-xs text-slate-400 mt-1">
                Formatos permitidos: PDF, DOC, DOCX, JPG, PNG (hasta 50 MB)
              </span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />
            </label>
          </div>
        ) : (
          /* PASO 2: DESBLOQUEO DEL CALCULADOR Y OPCIONES */
          <div>
            {/* Tira informativa con el archivo cargado y opción de cambiarlo */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📎</span>
                <div>
                  <span className="text-xs font-black text-blue-950 block">
                    {archivo.name}
                  </span>
                  <span className="text-[10px] text-blue-700">
                    {(archivo.size / 1024 / 1024).toFixed(2)} MB • Archivo listo para cotizar
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setArchivo(null)}
                className="text-xs font-bold text-rose-600 hover:underline shrink-0"
              >
                Cambiar archivo ✕
              </button>
            </div>

            {cargando ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 text-xs font-bold text-slate-400 animate-pulse">
                Cargando tarifas oficiales...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* CONFIGURACIÓN */}
                <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                      1. Formato y Tipo de Copia
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {tarifas
                        .filter((t) => t.categoria_servicio === "Impresión")
                        .map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setTarifaSeleccionadaId(t.id)}
                            className={`p-3 rounded-2xl border text-left transition-all ${
                              tarifaSeleccionadaId === t.id
                                ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-xs"
                                : "border-slate-200 hover:border-slate-300 bg-white"
                            }`}
                          >
                            <span className="block font-bold text-xs text-slate-900">{t.tipo}</span>
                            <span className="block text-[11px] font-black text-blue-600 mt-0.5">
                              ${t.precio_unitario} <span className="font-normal text-slate-400">/ carilla</span>
                            </span>
                          </button>
                        ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                        2. Cantidad de Páginas
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={paginas}
                        onChange={(e) => setPaginas(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Hojas de tu archivo</span>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                        Juegos / Copias
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={juegos}
                        onChange={(e) => setJuegos(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-3 py-2 text-sm font-bold border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Juegos idénticos</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                      3. Terminación (Opcional)
                    </label>

                    <div>
                      <select
                        value={anilladoId}
                        onChange={(e) =>
                          setAnilladoId(e.target.value === "ninguno" ? "ninguno" : Number(e.target.value))
                        }
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 font-medium text-slate-700"
                      >
                        <option value="ninguno">Sin anillado (sueltas o abrochadas)</option>
                        {anilladosDisponibles.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.tipo} (+${a.precio_unitario})
                          </option>
                        ))}
                      </select>
                    </div>

                    {tarifaPlastificado && (
                      <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={plastificado}
                          onChange={(e) => setPlastificado(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-xs font-bold text-slate-700">
                          Plastificado térmico (+${tarifaPlastificado.precio_unitario})
                        </span>
                      </label>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Aclaraciones o instrucciones
                    </label>
                    <textarea
                      rows={2}
                      value={aclaraciones}
                      onChange={(e) => setAclaraciones(e.target.value)}
                      placeholder="ej. Imprimir simple faz o a partir de la carilla 3..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50"
                    />
                  </div>
                </div>

                {/* RESUMEN */}
                <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg flex flex-col justify-between h-fit space-y-6">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Presupuesto Estimado
                    </span>
                    <div className="text-3xl font-black text-white mt-1">
                      ${totalCalculado.toLocaleString("es-AR")}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Calculado según las especificaciones del archivo.
                    </p>

                    <div className="mt-6 space-y-2 border-t border-slate-800 pt-4 text-xs">
                      <div className="flex justify-between text-slate-300">
                        <span>Hojas ({paginas} pág x {juegos} jgo):</span>
                        <span className="font-bold text-white">${subtotalHojas.toLocaleString("es-AR")}</span>
                      </div>

                      {costoAnillado > 0 && (
                        <div className="flex justify-between text-slate-300">
                          <span>Anillado:</span>
                          <span className="font-bold text-white">${costoAnillado.toLocaleString("es-AR")}</span>
                        </div>
                      )}

                      {costoPlastificado > 0 && (
                        <div className="flex justify-between text-slate-300">
                          <span>Plastificado:</span>
                          <span className="font-bold text-white">${costoPlastificado.toLocaleString("es-AR")}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleEnviarWhatsApp}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black py-3 px-4 rounded-2xl text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <span>💬 Enviar Presupuesto y Archivo</span>
                      <span>↗</span>
                    </button>
                    <p className="text-[10px] text-slate-400 text-center">
                      Se abrirá WhatsApp con el resumen listo para enviar junto a tu archivo.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}