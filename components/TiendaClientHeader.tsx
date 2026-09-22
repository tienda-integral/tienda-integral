"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/context/CartContext";

export default function TiendaClientHeader() {
  const { totalItems } = useCart();

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="relative h-10 w-28">
            <Image
              src="/logo.jpg"
              alt="Maktub Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="text-sm font-black text-rose-500 italic tracking-wider">TIENDA</span>
        </Link>

        <div>
          <Link
            href="/imprimir"
            className="border-2 border-teal-400 text-teal-700 hover:bg-teal-50 text-xs sm:text-sm font-bold px-4 py-2 rounded-full uppercase tracking-wider transition-all"
          >
            Quiero imprimir
          </Link>
        </div>

        <div className="flex items-center gap-5 text-sm font-medium text-stone-700">
          <Link href="/ayuda" className="hidden md:inline hover:text-teal-600">
            Ayuda
          </Link>
          <Link
            href="/carrito"
            className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 border border-stone-200 px-3.5 py-1.5 rounded-full transition-all"
          >
            <span>🛒</span>
            <span className="hidden sm:inline text-xs font-semibold">Carrito</span>
            <span className="bg-teal-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {totalItems}
            </span>
          </Link>
          <Link href="/login" className="flex items-center gap-1 hover:text-teal-600">
            <span>👤</span>
            <span className="hidden sm:inline text-xs">Ingresar</span>
          </Link>
        </div>
      </div>
    </header>
  );
}