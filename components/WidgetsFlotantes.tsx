"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/lib/context/CartContext";

export default function WidgetsFlotantes() {
  const { agregarProducto } = useCart();
  const [mostrarOferta, setMostrarOferta] = useState(false);
  const [ofertaCerrada, setOfertaCerrada] = useState(false);

  const ofertaFlash = {
    id: "flash-1",
    nombre: "Pack 3 Resaltadores Pastel",
    categoria: "Librería",
    precio: 3400,
    precioLista: 4500,
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const yaCerrada = sessionStorage.getItem("maktub_flash_closed");
      if (!yaCerrada) {
        setMostrarOferta(true);
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  const cerrarOferta = () => {
    setMostrarOferta(false);
    setOfertaCerrada(true);
    sessionStorage.setItem("maktub_flash_closed", "true");
  };

  const agregarOfertaFlash = () => {
    agregarProducto(ofertaFlash);
    cerrarOferta();
  };

  const numeroWhatsApp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5492604825533";
  const enlaceWsp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(
    "¡Hola Librería Maktub! Estoy en la web y tengo una consulta."
  )}`;

  return (
    <>
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
              onClick={agregarOfertaFlash}
              className="px-3.5 py-1.5 bg-teal-500 hover:bg-teal-600 active:scale-95 text-white font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <span>+ Sumar al Carrito</span>
            </button>
          </div>
        </div>
      )}

      <a
        href={enlaceWsp}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-4 sm:right-6 z-40 bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xl hover:shadow-2xl rounded-full px-4 py-3 sm:px-5 sm:py-3.5 flex items-center gap-2.5 transition-all duration-300 hover:scale-105 active:scale-95 border-2 border-white/40"
      >
        <span className="text-xl">💬</span>
        <span className="font-bold text-xs sm:text-sm tracking-wide hidden xs:inline">
          ¿Consultas? Escribinos
        </span>
      </a>
    </>
  );
}