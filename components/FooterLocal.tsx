"use client";

import Link from "next/link";

export default function FooterLocal() {
  return (
    <footer className="bg-stone-900 text-stone-300 pt-12 pb-8 border-t border-stone-800 text-xs font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
        
        {/* Columna 1: Identidad */}
        <div className="space-y-3">
          <h4 className="text-white font-black text-base tracking-tight">
            MAKTUB <span className="text-teal-400 font-serif italic text-sm">librería & express</span>
          </h4>
          <p className="text-stone-400 leading-relaxed text-xs">
            Concepto multirubro en San Rafael. Impresiones express, artículos escolares, cotillón, descartables y regalería en un único pedido coordinado.
          </p>
        </div>

        {/* Columna 2: Ubicación & Horarios */}
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

        {/* Columna 3: Formas de Pago & Retiro */}
        <div className="space-y-2">
          <h5 className="text-white font-bold text-xs uppercase tracking-wider text-teal-400">
            💳 Pagos y Envíos
          </h5>
          <ul className="space-y-1.5 text-stone-400">
            <li>• <strong className="text-stone-200">10% OFF</strong> por Transferencia Bancaria</li>
            <li>• Efectivo al retirar en el local</li>
            <li>• Retiro inmediato sin cola</li>
            <li>• Envíos coordinados dentro de San Rafael</li>
          </ul>
        </div>

        {/* Columna 4: Contacto Rápido */}
        <div className="space-y-2">
          <h5 className="text-white font-bold text-xs uppercase tracking-wider text-teal-400">
            📲 Canales Directos
          </h5>
          <p className="text-stone-300">
            WhatsApp Oficial:<br />
            <a
              href="https://wa.me/5492604825533"
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
        <p>© 2026 Maktub Multirubro. San Rafael, Mendoza.</p>
        <p>Precios expresados en pesos argentinos (ARS).</p>
      </div>
    </footer>
  );
}