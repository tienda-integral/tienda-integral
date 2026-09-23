"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCart, TipoPapel, TamanoHoja } from "@/lib/context/CartContext";
import { supabase } from "@/lib/supabase";

interface TarifaCopia {
  id: string;
  precio: number;
}

export default function ImprimirPage() {
  const { agregarImpresion } = useCart();

  const [archivo, setArchivo] = useState<File | null>(null);
  const [tamanoHoja, setTamanoHoja] = useState<TamanoHoja>("A4");
  const [tipoPapel, setTipoPapel] = useState<TipoPapel>("comun");
  const [color, setColor] = useState<"byn" | "color">("byn");
  const [faz, setFaz] = useState<"simple" | "doble">("simple");
  const [paginas, setPaginas] = useState<number>(1);
  const [copias, setCopias] = useState<number>(1);
  const [anillado, setAnillado] = useState<boolean>(false);
  const [agregadoExitoso, setAgregadoExitoso] = useState<boolean>(false);

  // Precios cargados desde Supabase (con fallback predeterminado)
  const [tarifas, setTarifas] = useState<Record<string, number>>({
    a4_bn_simple: 60,
    a4_bn_doble: 100,
    a4_color_simple: 200,
    a4_color_doble: 350,
    oficio_bn_simple: 80,
    oficio_bn_doble: 130,
    oficio_color_simple: 250,
    anillado_chico: 1500,
  });

  useEffect(() => {
    async function obtenerTarifas() {
      const { data, error } = await supabase
        .from("configuracion_copias")
        .select("id, precio");

      if (!error && data) {
        const mapaTarifas: Record<string, number> = {};
        data.forEach((item: TarifaCopia) => {
          mapaTarifas[item.id] = Number(item.precio);
        });
        setTarifas((prev) => ({ ...prev, ...mapaTarifas }));
      }
    }

    obtenerTarifas();
  }, []);

  // Determinar precio base según tamaño, color y faz configurados en Supabase
  const clavePrecio = `${tamanoHoja.toLowerCase() === "oficio" ? "oficio" : "a4"}_${color}_${faz}`;
  const PRECIO_BASE_PAGINA = tarifas[clavePrecio] ?? (color === "color" ? 200 : 60);

  const MULTIPLICADOR_PAPEL =
    tipoPapel === "fotografico"
      ? 2.5
      : tipoPapel === "autoadhesivo"
      ? 2.0
      : tipoPapel === "foto_autoadhesivo"
      ? 3.0
      : 1.0;

  const precioAnillado = tarifas["anillado_chico"] ?? 1500;

  const costoUnitarioPorCopia = Math.round(
    paginas * PRECIO_BASE_PAGINA * MULTIPLICADOR_PAPEL + (anillado ? precioAnillado : 0)
  );
  const totalEstimado = costoUnitarioPorCopia * copias;

  const handleArchivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArchivo(e.target.files[0]);
    }
  };

  const handleAgregarAlCarrito = (e: React.FormEvent) => {
    e.preventDefault();

    if (!archivo) {
      alert("Por favor selecciona o sube un archivo (PDF o Imagen).");
      return;
    }

    agregarImpresion({
      nombreArchivo: archivo.name,
      tamanoHoja,
      tipoPapel,
      color,
      faz,
      paginas: Number(paginas) || 1,
      copias: Number(copias) || 1,
      anillado,
      precioUnitario: costoUnitarioPorCopia,
      precioTotal: totalEstimado,
    });

    setAgregadoExitoso(true);
    setTimeout(() => setAgregadoExitoso(false), 3500);
  };

  return (
    <main className="min-h-screen bg-[#FAF9F6] py-10 px-4 text-stone-800 font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
              Maktub Express
            </span>
            <h1 className="text-3xl font-black text-stone-900 mt-2">
              Servicio de Impresión Online
            </h1>
          </div>
          <Link
            href="/"
            className="text-xs font-semibold text-stone-600 hover:text-teal-600 underline"
          >
            ← Volver al inicio
          </Link>
        </div>

        {agregadoExitoso && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between text-xs font-semibold animate-in fade-in">
            <span>✓ ¡Impresión agregada al carrito con éxito!</span>
            <Link
              href="/carrito"
              className="bg-emerald-600 text-white px-3 py-1.5 rounded-xl hover:bg-emerald-700 transition-colors"
            >
              Ver Carrito →
            </Link>
          </div>
        )}

        <form
          onSubmit={handleAgregarAlCarrito}
          className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6"
        >
          {/* Subida de archivo */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-2">
              1. Selecciona tu archivo (PDF, DOCX, JPG, PNG)
            </label>
            <input
              type="file"
              required
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={handleArchivoChange}
              className="w-full text-xs text-stone-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-stone-100 file:text-stone-800 hover:file:bg-stone-200 cursor-pointer border border-stone-200 rounded-2xl p-2"
            />
            {archivo && (
              <p className="mt-2 text-xs text-teal-600 font-medium">
                Archivo seleccionado: <strong>{archivo.name}</strong> ({(archivo.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Configuración */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-stone-100">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                Tamaño de Hoja
              </label>
              <select
                value={tamanoHoja}
                onChange={(e) => setTamanoHoja(e.target.value as TamanoHoja)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold bg-white"
              >
                <option value="A4">A4 (Estándar)</option>
                <option value="Oficio">Oficio / Legal</option>
                <option value="A3">A3 (Doble carta)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                Tipo de Papel
              </label>
              <select
                value={tipoPapel}
                onChange={(e) => setTipoPapel(e.target.value as TipoPapel)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold bg-white"
              >
                <option value="comun">Común obra 75/80g</option>
                <option value="autoadhesivo">Papel Autoadhesivo / Sticker</option>
                <option value="fotografico">Papel Fotográfico Brillante</option>
                <option value="foto_autoadhesivo">Fotográfico Autoadhesivo</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                Color de Impresión
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setColor("byn")}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold ${
                    color === "byn"
                      ? "border-teal-500 bg-teal-50 text-teal-800"
                      : "border-stone-200 bg-white text-stone-600"
                  }`}
                >
                  Blanco y Negro
                </button>
                <button
                  type="button"
                  onClick={() => setColor("color")}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold ${
                    color === "color"
                      ? "border-teal-500 bg-teal-50 text-teal-800"
                      : "border-stone-200 bg-white text-stone-600"
                  }`}
                >
                  Color
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                Faz
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFaz("simple")}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold ${
                    faz === "simple"
                      ? "border-teal-500 bg-teal-50 text-teal-800"
                      : "border-stone-200 bg-white text-stone-600"
                  }`}
                >
                  Simple Faz
                </button>
                <button
                  type="button"
                  onClick={() => setFaz("doble")}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold ${
                    faz === "doble"
                      ? "border-teal-500 bg-teal-50 text-teal-800"
                      : "border-stone-200 bg-white text-stone-600"
                  }`}
                >
                  Doble Faz
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                Cantidad de Páginas del archivo
              </label>
              <input
                type="number"
                min={1}
                value={paginas}
                onChange={(e) => setPaginas(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1.5">
                Juegos / Copias
              </label>
              <input
                type="number"
                min={1}
                value={copias}
                onChange={(e) => setCopias(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer p-3 border border-stone-200 rounded-2xl hover:bg-stone-50">
              <input
                type="checkbox"
                checked={anillado}
                onChange={(e) => setAnillado(e.target.checked)}
                className="w-4 h-4 accent-teal-600 rounded"
              />
              <span className="text-xs font-bold text-stone-800">
                Sumar anillado plástico con tapas transparente y negra (+${precioAnillado.toLocaleString("es-AR")})
              </span>
            </label>
          </div>

          {/* Subtotal y Botón */}
          <div className="pt-5 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] text-stone-500 block">Total Estimado:</span>
              <span className="text-2xl font-black text-teal-600">
                ${totalEstimado.toLocaleString("es-AR")}
              </span>
            </div>

            <button
              type="submit"
              className="py-3 px-6 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-2xl shadow-sm transition-all active:scale-95"
            >
              + Agregar al Carrito
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}