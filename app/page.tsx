"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/context/CartContext";
import NovedadesOfertas from "@/components/NovedadesOfertas";
import BuzonConsultas from "@/components/BuzonConsultas";

const RUBROS = [
  { nombre: "Librería", slug: "libreria", icono: "✏️", bg: "bg-teal-50 border-teal-200 text-teal-800" },
  { nombre: "Descartables", slug: "descartables", icono: "📦", bg: "bg-amber-50 border-amber-200 text-amber-800" },
  { nombre: "Cotillón", slug: "cotillon", icono: "🎉", bg: "bg-rose-50 border-rose-200 text-rose-800" },
  { nombre: "Regalería", slug: "regaleria", icono: "🎁", bg: "bg-purple-50 border-purple-200 text-purple-800" },
  { nombre: "Juguetería", slug: "jugueteria", icono: "🧸", bg: "bg-sky-50 border-sky-200 text-sky-800" },
];

export default function HomePage() {
  const { totalItems, agregarProducto } = useCart();
  const [mostrarOferta, setMostrarOferta] = useState(false);
  const [ofertaCerrada, setOfertaCerrada] = useState(false);
  const [toastMensaje, setToastMensaje] = useState<string | null>(null);

  const ofertaFlash = {
    id: "flash-1",
    nombre: "Pack 3 Resaltadores Pastel",
    categoria: "Librería",
    precio: 3400,
    precioLista: 4500,
  };

 useEffect(() => {
    // Aparece a los 2.5 segundos de cargar la página
    const timer = setTimeout(() => {
      setMostrarOferta(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const dispararToast = (nombreProd: string) => {
    setToastMensaje(`"${nombreProd}" añadido al carrito`);
    setTimeout(() => {
      setToastMensaje(null);
    }, 3200);
  };

  const cerrarOferta = () => {
    setMostrarOferta(false);
    setOfertaCerrada(true);
    sessionStorage.setItem("maktub_flash_closed", "true");
  };

  const handleAgregarOfertaFlash = () => {
    agregarProducto(ofertaFlash);
    dispararToast(ofertaFlash.nombre);
    cerrarOferta();
  };

  const numeroWhatsApp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5492604825533";
  const enlaceWsp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(
    "¡Hola Librería Maktub! Estoy en la web y tengo una consulta."
  )}`;

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-800 flex flex-col font-sans relative">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-12 w-36">
              <Image
                src="/logo.jpg"
                alt="Maktub Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>

          <div className="flex items-center gap-5 text-sm font-medium">
            <Link href="/ayuda" className="text-stone-600 hover:text-teal-600 transition-colors">
              Ayuda
            </Link>
            <Link href="/login" className="text-stone-600 hover:text-teal-600 transition-colors">
              Mi Cuenta
            </Link>
            <Link
              href="/carrito"
              className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-full px-4 py-2 transition-all active:scale-95"
            >
              <span>🛒</span>
              <span className="font-semibold text-xs text-stone-700">Carrito</span>
              <span className="bg-teal-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Notificación Toast flotante superior */}
      {toastMensaje && (
        <div className="fixed top-24 right-4 sm:right-8 z-50 bg-stone-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-stone-700 animate-in fade-in slide-in-from-top-4 duration-300">
          <span className="text-teal-400 font-bold text-base">✓</span>
          <div className="text-xs">
            <p className="font-semibold text-stone-100">{toastMensaje}</p>
            <Link href="/carrito" className="text-teal-400 hover:underline font-bold text-[11px] block mt-0.5">
              Ver Carrito e Iniciar Compra →
            </Link>
          </div>
        </div>
      )}

      <main className="flex-1">
        <section className="py-14 px-4 text-center max-w-3xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-teal-600 bg-teal-50 border border-teal-200 px-4 py-1.5 rounded-full">
            Nuevo Concepto Multirubro
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-stone-900 tracking-tight leading-tight mt-5">
            Todo lo que necesitás, <br />
            <span className="text-teal-600">en un solo pedido</span>
          </h1>
          <p className="mt-4 text-base text-stone-600 max-w-xl mx-auto">
            Imprimí tus archivos y comprá artículos de librería, descartables, cotillón, regalería y juguetes.
            Un solo carrito, un solo despacho.
          </p>
        </section>

        <section className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-gradient-to-br from-sky-50 to-teal-50 border border-teal-100 rounded-3xl p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-white/80 border border-teal-200 px-3 py-1 rounded-full">
                Servicios & Copistería
              </span>
              <h2 className="text-2xl font-black text-stone-900 mt-4 mb-2">
                MAKTUB <span className="text-teal-600 font-serif italic">express</span>
              </h2>
              <p className="text-stone-600 text-sm mb-6 leading-relaxed">
                Subí tus archivos (PDF, fotos, trabajos escolares), seleccioná tamaño y terminación, y retirálos listos.
              </p>
            </div>
            <div>
              <Link
                href="/imprimir"
                className="inline-block w-full text-center bg-teal-500 hover:bg-teal-600 text-white font-bold py-3.5 px-6 rounded-2xl shadow-sm transition-all"
              >
                QUIERO IMPRIMIR
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-rose-50 to-amber-50 border border-rose-100 rounded-3xl p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-white/80 border border-rose-200 px-3 py-1 rounded-full">
                Catálogo & Artículos
              </span>
              <h2 className="text-2xl font-black text-stone-900 mt-4 mb-2">
                MAKTUB <span className="text-rose-500 font-serif italic">tienda</span>
              </h2>
              <p className="text-stone-600 text-sm mb-6 leading-relaxed">
                Recorré nuestras secciones de librería, descartables, cotillón, regalería y juguetería en pocos clics.
              </p>
            </div>
            <div>
              <Link
                href="/tienda"
                className="inline-block w-full text-center bg-stone-800 hover:bg-stone-900 text-white font-bold py-3.5 px-6 rounded-2xl shadow-sm transition-all"
              >
                IR A LA TIENDA
              </Link>
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-4 pb-16">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-black text-stone-900">Nuestros Rubros</h3>
            <p className="text-xs text-stone-500 mt-1">Elegí una categoría para explorar productos</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {RUBROS.map((rubro) => (
              <Link
                key={rubro.slug}
                href={`/tienda?rubro=${encodeURIComponent(rubro.nombre)}`}
                className={`rounded-2xl p-6 text-center border transition-all hover:scale-105 hover:shadow-md ${rubro.bg}`}
              >
                <div className="text-4xl mb-3">{rubro.icono}</div>
                <h4 className="font-bold text-sm">{rubro.nombre}</h4>
                <span className="text-[11px] opacity-75 mt-1 inline-block">Ver catálogo →</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Novedades y Ofertas */}
        <NovedadesOfertas onProductoAgregado={dispararToast} />

        {/* Buzón de Consultas */}
        <BuzonConsultas />
      </main>

      {/* Footer Local */}
      <footer className="bg-stone-900 text-stone-300 pt-12 pb-8 border-t border-stone-800 text-xs font-sans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="space-y-3">
            <h4 className="text-white font-black text-base tracking-tight">
              MAKTUB <span className="text-teal-400 font-serif italic text-sm">librería & express</span>
            </h4>
            <p className="text-stone-400 leading-relaxed text-xs">
              Concepto multirubro en San Rafael. Impresiones express, artículos escolares, cotillón, descartables y regalería en un único pedido coordinado.
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="text-white font-bold text-xs uppercase tracking-wider text-teal-400">
              📍 Atención en el Local
            </h5>
            <p className="text-stone-300">San Rafael, Mendoza</p>
            <p className="text-stone-400">
              <span className="text-stone-300 font-medium">Lunes a Viernes:</span><br />
              08:30 a 13:00 hs — 16:30 a 20:30 hs
            </p>
            <p className="text-stone-400">
              <span className="text-stone-300 font-medium">Sábados:</span><br />
              09:00 a 13:00 hs
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="text-white font-bold text-xs uppercase tracking-wider text-teal-400">
              💳 Pagos y Envíos
            </h5>
            <ul className="space-y-1.5 text-stone-400">
              <li>• <strong className="text-stone-200">10% OFF</strong> por Transferencia Bancaria</li>
              <li>• Efectivo al retirar en el local</li>
              <li>• Retiro inmediato sin cola</li>
              <li>• Envíos coordinados en San Rafael</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h5 className="text-white font-bold text-xs uppercase tracking-wider text-teal-400">
              📲 Canales Directos
            </h5>
            <p className="text-stone-300">
              WhatsApp Oficial:<br />
              <a
                href={enlaceWsp}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-400 hover:text-teal-300 font-bold underline"
              >
                +54 9 260 482-5533
              </a>
            </p>
            <div className="pt-2">
              <Link
                href="/admin"
                className="text-[11px] text-stone-500 hover:text-stone-300 underline block"
              >
                Acceso Gestión Interna (ERP)
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 border-t border-stone-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-stone-500 gap-3">
          <p>© {new Date().getFullYear()} Maktub Multirubro. San Rafael, Mendoza.</p>
          <p>Precios expresados en pesos argentinos (ARS).</p>
        </div>
      </footer>

      {/* Oferta Instantánea Flotante */}
      {mostrarOferta && !ofertaCerrada && (
        <div className="fixed bottom-6 left-4 sm:left-6 z-40 max-w-xs sm:max-w-sm bg-white/95 backdrop-blur-md border border-stone-200 rounded-3xl p-4 shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚡</span>
              <div>
                <span className="text-[10px] font-black tracking-wider uppercase text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                  Oportunidad Flash
                </span>
                <h4 className="font-bold text-stone-900 text-xs mt-1">
                  {ofertaFlash.nombre}
                </h4>
              </div>
            </div>
            <button
              type="button"
              onClick={cerrarOferta}
              className="text-stone-400 hover:text-stone-600 text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center bg-stone-100 hover:bg-stone-200"
              aria-label="Cerrar oferta"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-stone-100">
            <div>
              <span className="text-[10px] text-stone-400 line-through block leading-none">
                ${ofertaFlash.precioLista.toLocaleString("es-AR")}
              </span>
              <span className="text-sm font-black text-teal-600">
                ${ofertaFlash.precio.toLocaleString("es-AR")}
              </span>
            </div>

            <button
              type="button"
              onClick={handleAgregarOfertaFlash}
              className="px-3.5 py-1.5 bg-teal-500 hover:bg-teal-600 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>+ Sumar al Carrito</span>
            </button>
          </div>
        </div>
      )}

      {/* Botón Flotante WhatsApp */}
      <a
        href={enlaceWsp}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-4 sm:right-6 z-40 bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xl hover:shadow-2xl rounded-full px-4 py-3 sm:px-5 sm:py-3.5 flex items-center gap-2.5 transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-white/40"
      >
        <span className="text-xl">💬</span>
        <span className="font-bold text-xs sm:text-sm tracking-wide hidden sm:inline">
          ¿Consultas? Escribinos
        </span>
      </a>
    </div>
  );
}