"use client";

import React, { useState, useEffect, useRef, useId } from "react";
import Link from "next/link";
import Script from "next/script";
import { useCart } from "@/lib/context/CartContext";

export interface ArchivoCargado {
  id: string;
  file: File;
  nombre: string;
  tamanoMb: string;
  formato: string;
  progreso: number;
  previewUrl?: string;
  paginasDetectadas: number;
  colorDetectado: number;
  bynDetectado: number;
  config: ConfiguracionArchivo;
}

export type ColorTapa = "negro" | "azul" | "rojo" | "verde" | "";

export interface ConfiguracionArchivo {
  tamano: "A4" | "Oficio" | "Carta" | "A3" | "";
  impresion: "byn" | "color" | "";
  caras: "simple" | "doble" | "";
  paginasPorCarilla: 1 | 2 | 4 | "";
  orientacion: "auto" | "vertical" | "horizontal" | "";
  tipoPapel: "obra_75_80" | "obra_90" | "ilustracion_150" | "foto_160" | "foto_auto_140" | "";
  colorPapel: "blanco" | "pastel" | "";
  copias: number;
  anillado: boolean;
  colorTapa: ColorTapa;
  corte: "sin_corte" | "medio" | "cuatro";
}

const CONFIG_VACIA: ConfiguracionArchivo = {
  tamano: "",
  impresion: "",
  caras: "",
  paginasPorCarilla: "",
  orientacion: "",
  tipoPapel: "",
  colorPapel: "",
  copias: 1,
  anillado: false,
  colorTapa: "",
  corte: "sin_corte",
};

// Escala de precios por volumen (1 a 10 | 11 a 20 | +20)
function calcularTarifaBase(tamano: string, impresion: string, caras: string, copias: number): number {
  let precioUnitario = 60;

  if (impresion === "byn") {
    if (caras === "simple") {
      precioUnitario = copias <= 10 ? 60 : copias <= 20 ? 50 : 40;
    } else {
      precioUnitario = copias <= 10 ? 50 : copias <= 20 ? 42 : 35;
    }
  } else {
    if (caras === "simple") {
      precioUnitario = copias <= 10 ? 220 : copias <= 20 ? 190 : 160;
    } else {
      precioUnitario = copias <= 10 ? 190 : copias <= 20 ? 160 : 130;
    }
  }

  if (tamano === "A3") precioUnitario *= 2.0;
  if (tamano === "Oficio") precioUnitario *= 1.15;

  return Math.round(precioUnitario);
}

function calcularRecargoPapel(tipo: string): number {
  switch (tipo) {
    case "obra_90": return 15;
    case "ilustracion_150": return 70;
    case "foto_160": return 120;
    case "foto_auto_140": return 150;
    default: return 0;
  }
}

// ASOCIACIÓN TÉCNICA 100% AUTOMÁTICA SEGÚN CANTIDAD DE HOJAS
export function obtenerDetalleAnillado(hojasFisicas: number): {
  diametro: string;
  capacidadMax: number;
  costo: number;
  descripcion: string;
} {
  const h = Math.max(1, hojasFisicas);
  if (h <= 25) {
    return { diametro: "7 mm", capacidadMax: 25, costo: 1200, descripcion: "Espiral 7 mm (hasta 25 hojas)" };
  } else if (h <= 50) {
    return { diametro: "9 mm", capacidadMax: 50, costo: 1400, descripcion: "Espiral 9 mm (hasta 50 hojas)" };
  } else if (h <= 70) {
    return { diametro: "12 mm", capacidadMax: 70, costo: 1600, descripcion: "Espiral 12 mm (hasta 70 hojas)" };
  } else if (h <= 85) {
    return { diametro: "14 mm", capacidadMax: 85, costo: 1800, descripcion: "Espiral 14 mm (hasta 85 hojas)" };
  } else if (h <= 100) {
    return { diametro: "17 mm", capacidadMax: 100, costo: 2000, descripcion: "Espiral 17 mm (hasta 100 hojas)" };
  } else if (h <= 120) {
    return { diametro: "20 mm", capacidadMax: 120, costo: 2200, descripcion: "Espiral 20 mm (hasta 120 hojas)" };
  } else if (h <= 140) {
    return { diametro: "23 mm", capacidadMax: 140, costo: 2400, descripcion: "Espiral 23 mm (hasta 140 hojas)" };
  } else if (h <= 160) {
    return { diametro: "25 mm", capacidadMax: 160, costo: 2600, descripcion: "Espiral 25 mm (hasta 160 hojas)" };
  } else if (h <= 200) {
    return { diametro: "29 mm", capacidadMax: 200, costo: 2900, descripcion: "Espiral 29 mm (hasta 200 hojas)" };
  } else if (h <= 250) {
    return { diametro: "33 mm", capacidadMax: 250, costo: 3300, descripcion: "Espiral 33 mm (hasta 250 hojas)" };
  } else if (h <= 350) {
    return { diametro: "40 mm", capacidadMax: 350, costo: 3800, descripcion: "Espiral 40 mm (hasta 350 hojas)" };
  } else if (h <= 400) {
    return { diametro: "45 mm", capacidadMax: 400, costo: 4300, descripcion: "Espiral 45 mm (hasta 400 hojas)" };
  } else if (h <= 450) {
    return { diametro: "50 mm", capacidadMax: 450, costo: 4800, descripcion: "Espiral 50 mm (hasta 450 hojas)" };
  } else {
    return { diametro: "2 Tomos", capacidadMax: 900, costo: 6500, descripcion: "2 Tomos separados (+450 hojas)" };
  }
}

export default function CotizadorImpresionesPage() {
  const { agregarImpresion, subtotal: subtotalCarrito } = useCart();
  const inputId = useId();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [archivos, setArchivos] = useState<ArchivoCargado[]>([]);
  const [archivoSeleccionadoId, setArchivoSeleccionadoId] = useState<string | null>(null);
  const [etapa, setEtapa] = useState<1 | 2>(1);
  const [zoomPreview, setZoomPreview] = useState<number>(100);
  const [paginaActualPreview, setPaginaActualPreview] = useState<number>(1);
  const [totalPaginasDoc, setTotalPaginasDoc] = useState<number>(1);
  const [mostrarModalCarrito, setMostrarModalCarrito] = useState<boolean>(false);
  const [pdfJsListo, setPdfJsListo] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      archivos.forEach((a) => {
        if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
      });
    };
  }, [archivos]);

  const archivoActivo = archivos.find((a) => a.id === archivoSeleccionadoId) || archivos[0];

  // RENDERIZADO MULTI-CARILLA EN CANVAS (1, 2 o 4 páginas por hoja física)
  useEffect(() => {
    if (!archivoActivo?.file || !pdfJsListo) return;

    const esPdf = archivoActivo.nombre.toLowerCase().endsWith(".pdf") || archivoActivo.file.type === "application/pdf";
    if (!esPdf) return;

    let cancelado = false;
    const reader = new FileReader();

    reader.onload = async function () {
      if (cancelado) return;
      try {
        const typedarray = new Uint8Array(this.result as ArrayBuffer);
        // @ts-ignore
        const loadingTask = window.pdfjsLib.getDocument(typedarray);
        const pdf = await loadingTask.promise;
        if (cancelado) return;

        setTotalPaginasDoc(pdf.numPages);

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const paginasPorCarilla = Number(archivoActivo.config.paginasPorCarilla) || 1;

        if (paginasPorCarilla === 1) {
          // 1 por carilla: Hoja vertical estándar
          const p = Math.min(paginaActualPreview, pdf.numPages);
          const page = await pdf.getPage(p);
          const viewport = page.getViewport({ scale: 1.1 });

          canvas.width = viewport.width;
          canvas.height = viewport.height;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          await page.render({ canvasContext: ctx, viewport }).promise;
        } else if (paginasPorCarilla === 2) {
          // 2 por carilla: Hoja apaisada con 2 páginas verticales lado a lado
          const p1 = paginaActualPreview;
          const p2 = p1 + 1 <= pdf.numPages ? p1 + 1 : null;

          const page1 = await pdf.getPage(p1);
          const vp1 = page1.getViewport({ scale: 0.8 });

          const sheetWidth = vp1.width * 2 + 30;
          const sheetHeight = vp1.height + 20;

          canvas.width = sheetWidth;
          canvas.height = sheetHeight;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Renderizar página 1 a la izquierda
          const tempCanvas1 = document.createElement("canvas");
          tempCanvas1.width = vp1.width;
          tempCanvas1.height = vp1.height;
          const tCtx1 = tempCanvas1.getContext("2d");
          if (tCtx1) {
            await page1.render({ canvasContext: tCtx1, viewport: vp1 }).promise;
            ctx.drawImage(tempCanvas1, 10, 10);
            ctx.strokeStyle = "#e2e8f0";
            ctx.strokeRect(10, 10, vp1.width, vp1.height);
          }

          // Línea punteada de división/plegado en el centro
          ctx.save();
          ctx.strokeStyle = "#cbd5e1";
          ctx.setLineDash([6, 6]);
          ctx.beginPath();
          ctx.moveTo(sheetWidth / 2, 0);
          ctx.lineTo(sheetWidth / 2, sheetHeight);
          ctx.stroke();
          ctx.restore();

          // Renderizar página 2 a la derecha
          if (p2) {
            const page2 = await pdf.getPage(p2);
            const vp2 = page2.getViewport({ scale: 0.8 });
            const tempCanvas2 = document.createElement("canvas");
            tempCanvas2.width = vp2.width;
            tempCanvas2.height = vp2.height;
            const tCtx2 = tempCanvas2.getContext("2d");
            if (tCtx2) {
              await page2.render({ canvasContext: tCtx2, viewport: vp2 }).promise;
              ctx.drawImage(tempCanvas2, vp1.width + 20, 10);
              ctx.strokeStyle = "#e2e8f0";
              ctx.strokeRect(vp1.width + 20, 10, vp2.width, vp2.height);
            }
          } else {
            // Espacio vacío si es impar
            ctx.fillStyle = "#f8fafc";
            ctx.fillRect(vp1.width + 20, 10, vp1.width, vp1.height);
            ctx.strokeStyle = "#e2e8f0";
            ctx.strokeRect(vp1.width + 20, 10, vp1.width, vp1.height);
            ctx.fillStyle = "#94a3b8";
            ctx.font = "12px sans-serif";
            ctx.fillText("[Carilla en blanco]", vp1.width + 40, vp1.height / 2);
          }
        } else if (paginasPorCarilla === 4) {
          // 4 por carilla: Cuadrícula 2x2
          const pStart = paginaActualPreview;
          const pageSample = await pdf.getPage(1);
          const vp = pageSample.getViewport({ scale: 0.55 });

          const sheetWidth = vp.width * 2 + 30;
          const sheetHeight = vp.height * 2 + 30;

          canvas.width = sheetWidth;
          canvas.height = sheetHeight;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Guías de corte en cruz
          ctx.save();
          ctx.strokeStyle = "#cbd5e1";
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(sheetWidth / 2, 0);
          ctx.lineTo(sheetWidth / 2, sheetHeight);
          ctx.moveTo(0, sheetHeight / 2);
          ctx.lineTo(sheetWidth, sheetHeight / 2);
          ctx.stroke();
          ctx.restore();

          const offsets = [
            { x: 10, y: 10 },
            { x: vp.width + 20, y: 10 },
            { x: 10, y: vp.height + 20 },
            { x: vp.width + 20, y: vp.height + 20 },
          ];

          for (let i = 0; i < 4; i++) {
            const numP = pStart + i;
            if (numP <= pdf.numPages) {
              const curPage = await pdf.getPage(numP);
              const tCan = document.createElement("canvas");
              tCan.width = vp.width;
              tCan.height = vp.height;
              const tC = tCan.getContext("2d");
              if (tC) {
                await curPage.render({ canvasContext: tC, viewport: vp }).promise;
                ctx.drawImage(tCan, offsets[i].x, offsets[i].y);
                ctx.strokeStyle = "#e2e8f0";
                ctx.strokeRect(offsets[i].x, offsets[i].y, vp.width, vp.height);
              }
            } else {
              ctx.fillStyle = "#f8fafc";
              ctx.fillRect(offsets[i].x, offsets[i].y, vp.width, vp.height);
              ctx.strokeStyle = "#e2e8f0";
              ctx.strokeRect(offsets[i].x, offsets[i].y, vp.width, vp.height);
            }
          }
        }
      } catch (err) {
        console.error("Error al renderizar canvas PDF:", err);
      }
    };

    reader.readAsArrayBuffer(archivoActivo.file);

    return () => {
      cancelado = true;
    };
  }, [archivoActivo, etapa, pdfJsListo, archivoActivo?.config.paginasPorCarilla, paginaActualPreview]);

  const procesarArchivos = (archivosNuevos: FileList | null) => {
    if (!archivosNuevos) return;

    const lista = Array.from(archivosNuevos);
    const espacioDisponible = 5 - archivos.length;

    if (lista.length > espacioDisponible) {
      alert(`Podés cargar hasta 5 archivos por pedido. Se cargaron los primeros ${espacioDisponible}.`);
    }

    const permitidos = lista.slice(0, espacioDisponible);

    permitidos.forEach((file) => {
      if (file.size > 100 * 1024 * 1024) {
        alert(`El archivo ${file.name} supera los 100 MB permitidos.`);
        return;
      }

      const extension = file.name.split(".").pop()?.toUpperCase() || "DOC";
      const nuevoId = `arch-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const previewUrl = URL.createObjectURL(file);

      const paginasAleatorias = Math.floor(Math.random() * 8) + 1;
      const tieneColor = Math.random() > 0.4;

      const item: ArchivoCargado = {
        id: nuevoId,
        file,
        nombre: file.name,
        tamanoMb: (file.size / (1024 * 1024)).toFixed(2),
        formato: extension,
        progreso: 0,
        previewUrl,
        paginasDetectadas: paginasAleatorias,
        colorDetectado: tieneColor ? paginasAleatorias : 0,
        bynDetectado: tieneColor ? 0 : paginasAleatorias,
        config: { ...CONFIG_VACIA },
      };

      setArchivos((prev) => [...prev, item]);

      let prog = 0;
      const interval = setInterval(() => {
        prog += 25;
        setArchivos((prev) =>
          prev.map((a) => (a.id === nuevoId ? { ...a, progreso: Math.min(prog, 100) } : a))
        );
        if (prog >= 100) clearInterval(interval);
      }, 90);
    });
  };

  const handleEliminarArchivo = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const arch = archivos.find((a) => a.id === id);
    if (arch?.previewUrl) URL.revokeObjectURL(arch.previewUrl);

    const filtrados = archivos.filter((a) => a.id !== id);
    setArchivos(filtrados);
    if (archivoSeleccionadoId === id) {
      setArchivoSeleccionadoId(filtrados.length > 0 ? filtrados[0].id : null);
    }
    if (filtrados.length === 0) setEtapa(1);
  };

  const actualizarConfigActiva = <K extends keyof ConfiguracionArchivo>(
    campo: K,
    valor: ConfiguracionArchivo[K]
  ) => {
    if (!archivoActivo) return;
    setArchivos((prev) =>
      prev.map((a) => {
        if (a.id !== archivoActivo.id) return a;
        const configActualizada = { ...a.config, [campo]: valor };
        if (campo === "anillado" && valor === false) {
          configActualizada.colorTapa = "";
        }
        return { ...a, config: configActualizada };
      })
    );
    // Reiniciar preview a la primera carilla
    if (campo === "paginasPorCarilla") {
      setPaginaActualPreview(1);
    }
  };

  const obtenerHojasFisicasArchivo = (arch: ArchivoCargado) => {
    const paginasPorCarilla = Number(arch.config.paginasPorCarilla) || 1;
    const paginasReales = Math.ceil(arch.paginasDetectadas / paginasPorCarilla);
    return arch.config.caras === "doble" ? Math.ceil(paginasReales / 2) : paginasReales;
  };

  const calcularSubtotalArchivo = (arch: ArchivoCargado) => {
    const { config } = arch;
    const hojasFisicas = obtenerHojasFisicasArchivo(arch);

    const costoTintaBase = calcularTarifaBase(
      config.tamano || "A4",
      config.impresion || "byn",
      config.caras || "simple",
      config.copias
    );
    const recargoPapel = calcularRecargoPapel(config.tipoPapel);
    const recargoColorPapel = config.colorPapel === "pastel" ? 10 : 0;

    const detalleAnillado = obtenerDetalleAnillado(hojasFisicas);
    const costoAnillado = config.anillado ? detalleAnillado.costo : 0;

    const costoCorte = config.corte === "medio" ? 250 : config.corte === "cuatro" ? 450 : 0;

    const costoUnitarioJuego =
      hojasFisicas * (costoTintaBase + recargoPapel + recargoColorPapel) + costoAnillado + costoCorte;
    return costoUnitarioJuego * config.copias;
  };

  const esArchivoCompleto = (arch: ArchivoCargado) => {
    const c = arch.config;
    const baseCompleto =
      c.tamano !== "" &&
      c.impresion !== "" &&
      c.caras !== "" &&
      c.paginasPorCarilla !== "" &&
      c.orientacion !== "" &&
      c.tipoPapel !== "" &&
      c.colorPapel !== "";

    if (!baseCompleto) return false;
    if (c.anillado && c.colorTapa === "") return false;
    return true;
  };

  const todosCompletos = archivos.length > 0 && archivos.every(esArchivoCompleto);

  const subtotalTotal = archivos.reduce((acc, curr) => acc + calcularSubtotalArchivo(curr), 0);
  const totalTransferencia = Math.round(subtotalTotal * 0.9);

  const hojasActivo = archivoActivo ? obtenerHojasFisicasArchivo(archivoActivo) : 1;
  const anilladoAutoActivo = obtenerDetalleAnillado(hojasActivo);

  const paginasPaso = Number(archivoActivo?.config.paginasPorCarilla) || 1;

  const handleAgregarAlCarrito = () => {
    if (!todosCompletos) {
      alert("Por favor completá todas las opciones obligatorias antes de enviar al carrito.");
      return;
    }

    archivos.forEach((arch) => {
      const costoTotal = calcularSubtotalArchivo(arch);
      agregarImpresion({
        nombreArchivo: arch.nombre,
        tamanoHoja: arch.config.tamano || "A4",
        tipoPapel: arch.config.tipoPapel || "obra_75_80",
        color: arch.config.impresion === "color",
        faz: arch.config.caras || "simple",
        anillado: arch.config.anillado
          ? `Sí (${anilladoAutoActivo.diametro} - Tapa ${arch.config.colorTapa})`
          : "No",
        copias: arch.config.copias,
        paginas: arch.paginasDetectadas,
        precioUnitario: Math.round(costoTotal / arch.config.copias),
        precioTotal: costoTotal,
      });
    });
    setMostrarModalCarrito(true);
  };

  return (
    <main className="min-h-screen bg-[#FAF9F6] text-stone-800 font-sans pb-20">
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
        strategy="afterInteractive"
        onLoad={() => {
          // @ts-ignore
          if (window.pdfjsLib) {
            // @ts-ignore
            window.pdfjsLib.GlobalWorkerOptions.workerSrc =
              "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
            setPdfJsListo(true);
          }
        }}
      />

      {/* Cabecera Maktub */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 px-4 py-3.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-teal-600 text-white font-black flex items-center justify-center text-sm shadow-sm">
                M
              </span>
              <span className="text-xl font-black text-stone-900 tracking-tight">
                LIBRERÍA <span className="text-teal-600">MAKTUB</span>
              </span>
            </Link>
            <span className="hidden sm:inline-block text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-full">
              Centro de Copiado
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/tienda"
              className="text-xs font-bold text-stone-600 hover:text-teal-700 px-3 py-1.5 rounded-xl transition-colors"
            >
              ← Ir a la Tienda
            </Link>
            <Link
              href="/carrito"
              className="bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95"
            >
              🛒 <span>Mi Carrito</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 pt-8">
        {/* ETAPA 1: SUBIDA */}
        {etapa === 1 ? (
          <div className="max-w-4xl mx-auto space-y-8 py-4">
            <div className="text-center space-y-3">
              <span className="text-xs font-black uppercase tracking-widest text-teal-700 bg-teal-50 border border-teal-200 px-4 py-1.5 rounded-full">
                Autoservicio Guiado
              </span>
              <h1 className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
                Centro de Copiado e Impresiones Online
              </h1>
              <p className="text-sm text-stone-600 max-w-xl mx-auto">
                Cargá hasta 5 archivos, aprovechá las escalas por volumen y recibilos terminados o retiralos por nuestro local.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-sm space-y-6">
              <label
                htmlFor={inputId}
                className="border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/30 hover:bg-teal-50/60 transition-all rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer text-center group"
              >
                <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-3xl shadow-md group-hover:scale-105 transition-transform mb-3">
                  📂
                </div>
                <span className="text-base font-black text-stone-900 mb-1">
                  Arrastrá tus documentos acá o hacé clic para buscar
                </span>
                <span className="text-xs text-stone-500 mb-4">
                  Soporta PDF, Word, Excel, PowerPoint y fotos (JPG/PNG) hasta 100 MB
                </span>
                <span className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-6 py-2.5 rounded-2xl shadow-sm transition-colors">
                  Examinar archivos
                </span>

                <input
                  id={inputId}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png"
                  onChange={(e) => procesarArchivos(e.target.files)}
                  className="hidden"
                />
              </label>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] font-bold text-stone-600">
                <span className="bg-stone-100 px-3 py-1 rounded-xl border border-stone-200">PDF</span>
                <span className="bg-stone-100 px-3 py-1 rounded-xl border border-stone-200">Word (.doc/.docx)</span>
                <span className="bg-stone-100 px-3 py-1 rounded-xl border border-stone-200">Excel (.xls/.xlsx)</span>
                <span className="bg-stone-100 px-3 py-1 rounded-xl border border-stone-200">PowerPoint (.ppt)</span>
                <span className="bg-stone-100 px-3 py-1 rounded-xl border border-stone-200">Fotos (.jpg/.png)</span>
              </div>

              {archivos.length > 0 && (
                <div className="space-y-3 border-t border-stone-100 pt-5">
                  <div className="flex items-center justify-between text-xs font-black text-stone-800">
                    <span>Archivos cargados ({archivos.length}/5)</span>
                    <span className="text-teal-700 font-bold">Límite: 5 documentos</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {archivos.map((arch) => (
                      <div key={arch.id} className="p-3 bg-stone-50 border border-stone-200 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-stone-900 truncate max-w-[200px]">
                            {arch.nombre}
                          </span>
                          <button
                            onClick={(e) => handleEliminarArchivo(arch.id, e)}
                            className="text-stone-400 hover:text-rose-600 font-bold text-xs"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-teal-600 h-full transition-all duration-200"
                            style={{ width: `${arch.progreso}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setArchivoSeleccionadoId(archivos[0]?.id || null);
                      setEtapa(2);
                    }}
                    className="w-full py-4 mt-2 bg-teal-600 hover:bg-teal-700 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    Personalizar e Imprimir ({archivos.length}) →
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ETAPA 2: CONFIGURACIÓN Y VISTA PREVIA */
          <div className="space-y-6">
            {/* Carrusel superior de documentos */}
            <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-sm flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {archivos.map((arch, idx) => {
                  const activo = arch.id === archivoActivo?.id;
                  const totalArch = calcularSubtotalArchivo(arch);
                  const completo = esArchivoCompleto(arch);

                  return (
                    <button
                      key={arch.id}
                      onClick={() => {
                        setArchivoSeleccionadoId(arch.id);
                        setPaginaActualPreview(1);
                      }}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border text-left transition-all ${
                        activo
                          ? "bg-teal-50 border-teal-500 shadow-sm text-teal-900 ring-2 ring-teal-500/20"
                          : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                          activo ? "bg-teal-600 text-white" : "bg-stone-200 text-stone-700"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div className="truncate max-w-[150px]">
                        <p className="text-xs font-bold truncate">{arch.nombre}</p>
                        <p className="text-[10px] text-stone-500 flex items-center gap-1">
                          {completo ? (
                            <span className="text-emerald-700 font-bold">✓ Configurado</span>
                          ) : (
                            <span className="text-rose-600 font-bold">Faltan datos</span>
                          )}
                        </p>
                      </div>
                      <span className="text-xs font-black">${totalArch}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEtapa(1)}
                  className="px-3.5 py-2 border border-stone-200 text-stone-700 hover:bg-stone-50 rounded-xl text-xs font-bold"
                >
                  + Cargar otro archivo
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Visor Real (Izquierda) */}
              <div className="lg:col-span-5 space-y-4">
                {archivoActivo && (
                  <div className="bg-white border border-stone-200 rounded-3xl p-4 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center text-lg font-bold">
                        📄
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-teal-700">Diagnóstico técnico</span>
                        <div className="flex items-center gap-2 text-xs font-bold text-stone-800">
                          <span>{archivoActivo.formato}</span>
                          <span>•</span>
                          <span>{archivoActivo.paginasDetectadas} págs</span>
                          <span>•</span>
                          <span className="text-emerald-700">Hojas reales: {hojasActivo}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-black px-2 py-1 rounded-full bg-stone-100 text-stone-600">
                      Auto-detectado
                    </span>
                  </div>
                )}

                <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
                        Vista previa de la hoja
                      </span>
                      <span className="text-[10px] font-semibold text-teal-700">
                        {paginasPaso === 1
                          ? "1 página por hoja"
                          : paginasPaso === 2
                          ? "2 páginas en paralelo (lado a lado)"
                          : "4 páginas en cuadrícula"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setZoomPreview((z) => Math.max(75, z - 15))}
                        className="w-7 h-7 rounded-lg border border-stone-200 text-xs font-bold hover:bg-stone-50"
                      >
                        -
                      </button>
                      <span className="text-[11px] font-bold text-stone-600 px-1">{zoomPreview}%</span>
                      <button
                        onClick={() => setZoomPreview((z) => Math.min(130, z + 15))}
                        className="w-7 h-7 rounded-lg border border-stone-200 text-xs font-bold hover:bg-stone-50"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Lienzo del Visor de Imposición */}
                  <div className="w-full h-[460px] bg-stone-100 rounded-2xl border border-stone-200 overflow-hidden flex items-center justify-center relative shadow-inner p-3">
                    {archivoActivo?.previewUrl ? (
                      archivoActivo.nombre.toLowerCase().endsWith(".pdf") || archivoActivo.file.type === "application/pdf" ? (
                        <div className="w-full h-full flex items-center justify-center overflow-auto">
                          <canvas
                            ref={canvasRef}
                            className="max-h-full max-w-full rounded-lg shadow-md transition-transform duration-200 bg-white"
                            style={{
                              transform: `scale(${zoomPreview / 100})`,
                              filter: archivoActivo.config.impresion === "byn" ? "grayscale(100%) contrast(110%)" : "none",
                            }}
                          />
                        </div>
                      ) : archivoActivo.file.type.startsWith("image/") || /\.(jpe?g|png|webp)$/i.test(archivoActivo.nombre) ? (
                        <div className="w-full h-full p-2 flex items-center justify-center bg-stone-900/5 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={archivoActivo.previewUrl}
                            alt={archivoActivo.nombre}
                            className="max-h-full max-w-full object-contain rounded-lg shadow-sm transition-transform duration-200"
                            style={{
                              transform: `scale(${zoomPreview / 100})`,
                              filter: archivoActivo.config.impresion === "byn" ? "grayscale(100%) contrast(110%)" : "none",
                            }}
                          />
                        </div>
                      ) : (
                        <div className="text-center p-6 space-y-3 bg-white w-full h-full flex flex-col items-center justify-center">
                          <div className="w-16 h-16 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center text-3xl mx-auto shadow-sm">
                            📑
                          </div>
                          <p className="text-xs font-bold text-stone-800 max-w-[220px] truncate">
                            {archivoActivo.nombre}
                          </p>
                          <span className="text-[10px] font-black uppercase text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
                            Documento {archivoActivo.formato}
                          </span>
                          <p className="text-[11px] text-stone-500 max-w-xs">
                            Los documentos Office se procesan directamente en nuestros equipos respetando el diseño original.
                          </p>
                        </div>
                      )
                    ) : (
                      <div className="text-stone-400 text-xs font-semibold">Cargando archivo...</div>
                    )}
                  </div>

                  {/* Navegador de páginas del documento */}
                  {totalPaginasDoc > 1 && (
                    <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-xs">
                      <button
                        onClick={() => setPaginaActualPreview((p) => Math.max(1, p - paginasPaso))}
                        disabled={paginaActualPreview <= 1}
                        className="px-3 py-1.5 rounded-xl border border-stone-200 font-bold hover:bg-stone-50 disabled:opacity-40 transition-colors"
                      >
                        ← Anterior
                      </button>

                      <span className="font-bold text-stone-700">
                        Pág. {paginaActualPreview} {paginasPaso > 1 && `- ${Math.min(totalPaginasDoc, paginaActualPreview + paginasPaso - 1)}`}{" "}
                        de {totalPaginasDoc}
                      </span>

                      <button
                        onClick={() => setPaginaActualPreview((p) => Math.min(totalPaginasDoc, p + paginasPaso))}
                        disabled={paginaActualPreview + paginasPaso > totalPaginasDoc}
                        className="px-3 py-1.5 rounded-xl border border-stone-200 font-bold hover:bg-stone-50 disabled:opacity-40 transition-colors"
                      >
                        Siguiente →
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Panel de Configuración con Badges Dinámicos y Tapas de Anillado */}
              <div className="lg:col-span-7 space-y-5">
                <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-6">
                  {/* Selector interactivo de Copias */}
                  <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-black uppercase tracking-wider text-teal-900 block">
                          Cantidad de Copias / Juegos
                        </span>
                        <span className="text-[11px] text-teal-700">Escalas con descuento por volumen</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            actualizarConfigActiva("copias", Math.max(1, (archivoActivo?.config.copias || 1) - 1))
                          }
                          className="w-9 h-9 rounded-xl bg-white border border-teal-300 font-black text-stone-800 hover:bg-teal-100 active:scale-95 transition-all text-sm"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-lg font-black text-stone-900">
                          {archivoActivo?.config.copias}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            actualizarConfigActiva("copias", (archivoActivo?.config.copias || 1) + 1)
                          }
                          className="w-9 h-9 rounded-xl bg-teal-600 text-white font-black hover:bg-teal-700 active:scale-95 transition-all text-sm shadow-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold pt-1">
                      <div
                        className={`p-2 rounded-xl border transition-all ${
                          (archivoActivo?.config.copias || 1) <= 10
                            ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                            : "bg-white text-stone-600 border-stone-200"
                        }`}
                      >
                        <span className="block text-[10px] uppercase">1 a 10</span>
                        <span>Tarifa Base</span>
                      </div>
                      <div
                        className={`p-2 rounded-xl border transition-all ${
                          (archivoActivo?.config.copias || 1) > 10 && (archivoActivo?.config.copias || 1) <= 20
                            ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                            : "bg-white text-stone-600 border-stone-200"
                        }`}
                      >
                        <span className="block text-[10px] uppercase">11 a 20</span>
                        <span>-15% Ahorro</span>
                      </div>
                      <div
                        className={`p-2 rounded-xl border transition-all ${
                          (archivoActivo?.config.copias || 1) > 20
                            ? "bg-teal-600 text-white border-teal-600 shadow-sm"
                            : "bg-white text-stone-600 border-stone-200"
                        }`}
                      >
                        <span className="block text-[10px] uppercase">+20 copias</span>
                        <span>-30% Mayorista</span>
                      </div>
                    </div>
                  </div>

                  {/* Grilla de Opciones con etiquetas dinámicas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Tinta */}
                    <div className="p-3.5 border border-stone-200 rounded-2xl space-y-1.5">
                      <label className="text-xs font-bold text-stone-700 flex items-center justify-between">
                        <span>Color de Impresión</span>
                        {archivoActivo?.config.impresion === "" ? (
                          <span className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full animate-pulse">
                            OBLIGATORIO
                          </span>
                        ) : (
                          <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            ✓ Listo
                          </span>
                        )}
                      </label>
                      <select
                        value={archivoActivo?.config.impresion}
                        onChange={(e) => actualizarConfigActiva("impresion", e.target.value as any)}
                        className={`w-full p-2 rounded-xl text-xs font-bold border transition-colors ${
                          archivoActivo?.config.impresion === ""
                            ? "border-rose-300 bg-rose-50/30 text-stone-400"
                            : "border-stone-200 bg-stone-50 text-stone-800"
                        }`}
                      >
                        <option value="">Seleccionar tinta...</option>
                        <option value="byn">Blanco y Negro</option>
                        <option value="color">Color</option>
                      </select>
                    </div>

                    {/* Caras */}
                    <div className="p-3.5 border border-stone-200 rounded-2xl space-y-1.5">
                      <label className="text-xs font-bold text-stone-700 flex items-center justify-between">
                        <span>Caras de Impresión</span>
                        {archivoActivo?.config.caras === "" ? (
                          <span className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full animate-pulse">
                            OBLIGATORIO
                          </span>
                        ) : (
                          <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            ✓ Listo
                          </span>
                        )}
                      </label>
                      <select
                        value={archivoActivo?.config.caras}
                        onChange={(e) => actualizarConfigActiva("caras", e.target.value as any)}
                        className={`w-full p-2 rounded-xl text-xs font-bold border transition-colors ${
                          archivoActivo?.config.caras === ""
                            ? "border-rose-300 bg-rose-50/30 text-stone-400"
                            : "border-stone-200 bg-stone-50 text-stone-800"
                        }`}
                      >
                        <option value="">Seleccionar caras...</option>
                        <option value="simple">Simple Faz</option>
                        <option value="doble">Doble Faz</option>
                      </select>
                    </div>

                    {/* Tamaño */}
                    <div className="p-3.5 border border-stone-200 rounded-2xl space-y-1.5">
                      <label className="text-xs font-bold text-stone-700 flex items-center justify-between">
                        <span>Tamaño de Hoja</span>
                        {archivoActivo?.config.tamano === "" ? (
                          <span className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full animate-pulse">
                            OBLIGATORIO
                          </span>
                        ) : (
                          <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            ✓ Listo
                          </span>
                        )}
                      </label>
                      <select
                        value={archivoActivo?.config.tamano}
                        onChange={(e) => actualizarConfigActiva("tamano", e.target.value as any)}
                        className={`w-full p-2 rounded-xl text-xs font-bold border transition-colors ${
                          archivoActivo?.config.tamano === ""
                            ? "border-rose-300 bg-rose-50/30 text-stone-400"
                            : "border-stone-200 bg-stone-50 text-stone-800"
                        }`}
                      >
                        <option value="">Seleccionar tamaño...</option>
                        <option value="A4">A4 (Estándar)</option>
                        <option value="Oficio">Oficio / Legal</option>
                        <option value="Carta">Carta</option>
                        <option value="A3">A3 (Pliego doble)</option>
                      </select>
                    </div>

                    {/* Páginas por carilla (Reflejo directo en el Visor) */}
                    <div className="p-3.5 border border-stone-200 rounded-2xl space-y-1.5">
                      <label className="text-xs font-bold text-stone-700 flex items-center justify-between">
                        <span>Páginas por Carilla</span>
                        {archivoActivo?.config.paginasPorCarilla === "" ? (
                          <span className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full animate-pulse">
                            OBLIGATORIO
                          </span>
                        ) : (
                          <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            ✓ Listo
                          </span>
                        )}
                      </label>
                      <select
                        value={archivoActivo?.config.paginasPorCarilla}
                        onChange={(e) =>
                          actualizarConfigActiva("paginasPorCarilla", e.target.value ? (Number(e.target.value) as any) : "")
                        }
                        className={`w-full p-2 rounded-xl text-xs font-bold border transition-colors ${
                          archivoActivo?.config.paginasPorCarilla === ""
                            ? "border-rose-300 bg-rose-50/30 text-stone-400"
                            : "border-stone-200 bg-stone-50 text-stone-800"
                        }`}
                      >
                        <option value="">Seleccionar páginas...</option>
                        <option value={1}>1 por carilla (Estándar)</option>
                        <option value={2}>2 por carilla (2 en 1 apaisado)</option>
                        <option value={4}>4 por carilla (Cuadrícula 2x2)</option>
                      </select>
                    </div>

                    {/* Orientación */}
                    <div className="p-3.5 border border-stone-200 rounded-2xl space-y-1.5">
                      <label className="text-xs font-bold text-stone-700 flex items-center justify-between">
                        <span>Orientación</span>
                        {archivoActivo?.config.orientacion === "" ? (
                          <span className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full animate-pulse">
                            OBLIGATORIO
                          </span>
                        ) : (
                          <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            ✓ Listo
                          </span>
                        )}
                      </label>
                      <select
                        value={archivoActivo?.config.orientacion}
                        onChange={(e) => actualizarConfigActiva("orientacion", e.target.value as any)}
                        className={`w-full p-2 rounded-xl text-xs font-bold border transition-colors ${
                          archivoActivo?.config.orientacion === ""
                            ? "border-rose-300 bg-rose-50/30 text-stone-400"
                            : "border-stone-200 bg-stone-50 text-stone-800"
                        }`}
                      >
                        <option value="">Seleccionar orientación...</option>
                        <option value="auto">Automático</option>
                        <option value="vertical">Vertical</option>
                        <option value="horizontal">Horizontal</option>
                      </select>
                    </div>

                    {/* Tipo de Papel */}
                    <div className="p-3.5 border border-stone-200 rounded-2xl space-y-1.5">
                      <label className="text-xs font-bold text-stone-700 flex items-center justify-between">
                        <span>Tipo de Papel</span>
                        {archivoActivo?.config.tipoPapel === "" ? (
                          <span className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full animate-pulse">
                            OBLIGATORIO
                          </span>
                        ) : (
                          <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            ✓ Listo
                          </span>
                        )}
                      </label>
                      <select
                        value={archivoActivo?.config.tipoPapel}
                        onChange={(e) => actualizarConfigActiva("tipoPapel", e.target.value as any)}
                        className={`w-full p-2 rounded-xl text-xs font-bold border transition-colors ${
                          archivoActivo?.config.tipoPapel === ""
                            ? "border-rose-300 bg-rose-50/30 text-stone-400"
                            : "border-stone-200 bg-stone-50 text-stone-800"
                        }`}
                      >
                        <option value="">Seleccionar papel...</option>
                        <option value="obra_75_80">Obra 75/80g</option>
                        <option value="obra_90">Obra 90g</option>
                        <option value="ilustracion_150">Ilustración 150g</option>
                        <option value="foto_160">Fotográfico 160g</option>
                        <option value="foto_auto_140">Fotográfico Autoadhesivo 140g</option>
                      </select>
                    </div>

                    {/* Color de Papel */}
                    <div className="p-3.5 border border-stone-200 rounded-2xl space-y-1.5">
                      <label className="text-xs font-bold text-stone-700 flex items-center justify-between">
                        <span>Color de Papel</span>
                        {archivoActivo?.config.colorPapel === "" ? (
                          <span className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full animate-pulse">
                            OBLIGATORIO
                          </span>
                        ) : (
                          <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                            ✓ Listo
                          </span>
                        )}
                      </label>
                      <select
                        value={archivoActivo?.config.colorPapel}
                        onChange={(e) => actualizarConfigActiva("colorPapel", e.target.value as any)}
                        className={`w-full p-2 rounded-xl text-xs font-bold border transition-colors ${
                          archivoActivo?.config.colorPapel === ""
                            ? "border-rose-300 bg-rose-50/30 text-stone-400"
                            : "border-stone-200 bg-stone-50 text-stone-800"
                        }`}
                      >
                        <option value="">Seleccionar color...</option>
                        <option value="blanco">Blanco</option>
                        <option value="pastel">Colores pastel</option>
                      </select>
                    </div>

                    {/* Anillado */}
                    <div className="p-3.5 border border-stone-200 rounded-2xl space-y-1.5">
                      <label className="text-xs font-bold text-stone-700 flex items-center justify-between">
                        <span>Anillado Espiralado</span>
                        <span className="text-[9px] text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded-full">
                          {hojasActivo} {hojasActivo === 1 ? "hoja" : "hojas"}
                        </span>
                      </label>
                      <select
                        value={archivoActivo?.config.anillado ? "si" : "no"}
                        onChange={(e) => actualizarConfigActiva("anillado", e.target.value === "si")}
                        className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-800"
                      >
                        <option value="no">No anillar</option>
                        <option value="si">
                          Sí, anillar (+${anilladoAutoActivo.costo.toLocaleString("es-AR")})
                        </option>
                      </select>

                      {archivoActivo?.config.anillado && (
                        <p className="text-[10px] text-teal-700 font-semibold pt-1">
                          ✓ Asignado automáticamente: {anilladoAutoActivo.descripcion}
                        </p>
                      )}
                    </div>

                    {/* Color de Tapa Condicional */}
                    {archivoActivo?.config.anillado && (
                      <div className="p-3.5 border border-teal-200 bg-teal-50/30 rounded-2xl space-y-1.5 animate-in fade-in duration-200">
                        <label className="text-xs font-bold text-stone-700 flex items-center justify-between">
                          <span>Color de Tapas Plásticas</span>
                          {archivoActivo?.config.colorTapa === "" ? (
                            <span className="text-[9px] font-black text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full animate-pulse">
                              OBLIGATORIO
                            </span>
                          ) : (
                            <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                              ✓ Listo
                            </span>
                          )}
                        </label>
                        <select
                          value={archivoActivo?.config.colorTapa}
                          onChange={(e) => actualizarConfigActiva("colorTapa", e.target.value as any)}
                          className={`w-full p-2 rounded-xl text-xs font-bold border transition-colors ${
                            archivoActivo?.config.colorTapa === ""
                              ? "border-rose-300 bg-rose-50/30 text-stone-400"
                              : "border-stone-200 bg-white text-stone-800"
                          }`}
                        >
                          <option value="">Seleccionar color de tapa...</option>
                          <option value="negro">⚫ Tapa Negra</option>
                          <option value="azul">🔵 Tapa Azul</option>
                          <option value="rojo">🔴 Tapa Roja</option>
                          <option value="verde">🟢 Tapa Verde</option>
                        </select>
                      </div>
                    )}

                    {/* Corte en hoja */}
                    <div className="p-3.5 border border-stone-200 rounded-2xl space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-bold text-stone-700 block">
                        Corte en Guillotina
                      </label>
                      <select
                        value={archivoActivo?.config.corte}
                        onChange={(e) => actualizarConfigActiva("corte", e.target.value as any)}
                        className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-800"
                      >
                        <option value="sin_corte">Sin corte (hoja entera)</option>
                        <option value="medio">Corte al medio (2 partes, +$250)</option>
                        <option value="cuatro">Corte en 4 partes (+$450)</option>
                      </select>
                    </div>
                  </div>

                  {/* Resumen del Pedido al pie */}
                  <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-xs text-stone-500 font-bold block">
                          Total Pedido ({archivos.length} archivos):
                        </span>
                        <div className="flex items-baseline gap-3">
                          <span className="text-3xl font-black text-stone-900">${subtotalTotal}</span>
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                            Transferencia: ${totalTransferencia} (10% OFF)
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleAgregarAlCarrito}
                        disabled={!todosCompletos}
                        className={`py-3.5 px-8 font-black text-xs uppercase tracking-wider rounded-2xl shadow-md transition-all ${
                          todosCompletos
                            ? "bg-teal-600 hover:bg-teal-700 text-white cursor-pointer active:scale-95"
                            : "bg-stone-300 text-stone-500 cursor-not-allowed"
                        }`}
                      >
                        {todosCompletos ? "Agregar al Carrito" : "Completar obligatorios"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL CARRITO ÚNICO */}
      {mostrarModalCarrito && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-700">
                  Librería & Centro de Copiado
                </span>
                <h3 className="text-2xl font-black text-stone-900">Tu Carrito</h3>
              </div>
              <button
                onClick={() => setMostrarModalCarrito(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-100 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
                TRABAJOS DE IMPRESIÓN CARGADOS
              </span>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-stone-800">Maktub Express</h4>
                  <p className="text-xs text-stone-500">{archivos.length} archivo(s) configurado(s)</p>
                </div>
                <span className="text-lg font-black text-teal-700">${subtotalTotal}</span>
              </div>
            </div>

            <div className="border-t border-stone-100 pt-3 flex justify-between items-baseline">
              <span className="text-sm font-bold text-stone-600">Total en Carrito</span>
              <span className="text-3xl font-black text-stone-900">
                ${subtotalCarrito > 0 ? subtotalCarrito : subtotalTotal}
              </span>
            </div>

            <p className="text-xs text-stone-500 text-center">
              Podés continuar navegando en la librería o avanzar para confirmar el pedido.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link
                href="/tienda"
                className="py-3 px-4 rounded-2xl border border-stone-300 hover:bg-stone-50 font-bold text-xs text-stone-700 text-center transition-colors flex items-center justify-center"
              >
                Seguir comprando
              </Link>
              <Link
                href="/carrito"
                className="py-3 px-4 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs text-center transition-colors shadow-md flex items-center justify-center"
              >
                Ir a Pagar →
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}