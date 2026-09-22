"use client";

import React, { useState } from "react";
import { useCart } from "@/lib/context/CartContext";

export default function BotonAgregarCarrito({
  producto,
}: {
  producto: {
    id: string | number;
    nombre: string;
    precio: number;
    categoria?: string;
  };
}) {
  const { agregarProducto } = useCart();
  const [agregado, setAgregado] = useState(false);

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();

    agregarProducto({
      id: producto.id,
      nombre: producto.nombre,
      precio: Number(producto.precio) || 0,
      categoria: producto.categoria || "Varios",
    });

    setAgregado(true);
    setTimeout(() => {
      setAgregado(false);
    }, 1200);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`mt-3 w-full border text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none ${
        agregado
          ? "bg-teal-600 text-white border-teal-600"
          : "bg-teal-50 hover:bg-teal-500 text-teal-700 hover:text-white border-teal-200 hover:border-transparent active:scale-95"
      }`}
    >
      <span>{agregado ? "✓" : "🛒"}</span>
      <span>{agregado ? "¡Agregado!" : "Agregar"}</span>
    </button>
  );
}