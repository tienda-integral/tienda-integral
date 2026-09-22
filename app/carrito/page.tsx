"use client";

import Link from "next/link";
import { useCart } from "@/lib/context/CartContext";

export default function CarritoPage() {
  const {
    items,
    subtotal,
    totalItems,
    actualizarCantidad,
    eliminarDelCarrito,
    vaciarCarrito,
  } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-800">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-sm w-full shadow-xs">
          <div className="text-4xl mb-3">🛒</div>
          <h2 className="text-lg font-black text-slate-900">Tu carrito está vacío</h2>
          <p className="text-xs text-slate-400 mt-1 mb-6">
            Explorá el catálogo o el centro de copiado para agregar artículos.
          </p>
          <Link
            href="/tienda"
            className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors"
          >
            ← Ir a la Tienda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-16">
      <header className="bg-white border-b border-slate-200 py-3.5 px-4 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-xl flex items-center justify-center font-black text-sm">
              M
            </div>
            <span className="font-black text-slate-900 tracking-tight text-sm">
              MAKTUB • Carrito de Compras ({totalItems})
            </span>
          </div>
          <Link
            href="/tienda"
            className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
          >
            ← Seguir Comprando
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <h1 className="text-base font-black text-slate-900">
              Artículos en el Carrito
            </h1>
            <button
              type="button"
              onClick={vaciarCarrito}
              className="text-xs font-bold text-slate-400 hover:text-rose-600 transition-colors"
            >
              Vaciar carrito
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {items.map((item) => {
              const precioItem = item.precioTotal ?? (item.precio * item.cantidad);
              return (
                <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 text-lg overflow-hidden">
                      {item.imagen_url ? (
                        <img
                          src={item.imagen_url}
                          alt={item.nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{item.tipo === "impresion" ? "🖨️" : "📦"}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-slate-900 truncate">
                        {item.nombre}
                      </h3>
                      {item.tipo === "impresion" && (
                        <span className="text-[10px] text-blue-600 font-semibold block">
                          {item.tamanoHoja} • {item.faz} • {item.anillado ? "Con Anillado" : "Sin anillar"}
                        </span>
                      )}
                      <span className="text-xs font-black text-slate-700 block mt-0.5">
                        ${precioItem.toLocaleString("es-AR")}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => actualizarCantidad(item.id, item.cantidad - 1)}
                      className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="text-xs font-black w-5 text-center">
                      {item.cantidad}
                    </span>
                    <button
                      type="button"
                      onClick={() => actualizarCantidad(item.id, item.cantidad + 1)}
                      className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-bold flex items-center justify-center"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => eliminarDelCarrito(item.id)}
                      className="text-xs text-rose-500 hover:text-rose-700 ml-2"
                      title="Eliminar ítem"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            <div className="flex justify-between text-sm font-bold text-slate-600">
              <span>Subtotal:</span>
              <span className="text-base font-black text-slate-900">
                ${subtotal.toLocaleString("es-AR")}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              * El costo de envío y posibles descuentos por forma de pago se calculan en el siguiente paso.
            </p>
          </div>

          <div className="pt-2">
            <Link
              href="/checkout"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <span>Continuar al Checkout (Envío y Pago)</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}