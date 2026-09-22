"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// Tipos compatibles para app/imprimir y componentes
export type TipoPapel = "obra" | "fotografico" | "ilustracion" | "reciclado" | string;
export type TamanoHoja = "A4" | "Oficio" | "A3" | string;

export interface ItemCarrito {
  id: string | number;
  tipo?: "producto" | "impresion" | string;
  nombre: string;
  precio: number;
  imagen_url?: string;
  cantidad: number;

  // Propiedades opcionales para pedidos de impresión / copiado
  categoria?: string;
  nombreArchivo?: string;
  paginas?: number;
  copias?: number;
  precioUnitario?: number;
  precioTotal?: number;
  tamanoHoja?: TamanoHoja;
  tipoPapel?: TipoPapel;
  color?: boolean | string;
  faz?: "simple" | "doble" | string;
  anillado?: boolean | string;
}

export interface DetalleImpresion {
  nombreArchivo: string;
  tamanoHoja: TamanoHoja;
  tipoPapel: TipoPapel;
  color: boolean | string;
  faz: "simple" | "doble" | string;
  anillado: boolean | string;
  copias: number;
  paginas?: number;
  precioUnitario: number;
  precioTotal: number;
}

interface CartContextType {
  items: ItemCarrito[];
  // Funciones unificadas para agregar productos
  agregarProducto: (producto: {
    id: number | string;
    nombre: string;
    precio: number;
    imagen_url?: string;
    categoria?: string;
  }) => void;
  agregarAlCarrito: (producto: {
    id: number | string;
    nombre: string;
    precio: number;
    imagen_url?: string;
    categoria?: string;
  }) => void;
  // Función para copiado / impresiones
  agregarImpresion: (detalle: DetalleImpresion) => void;
  // Operaciones estándar
  eliminarDelCarrito: (id: string | number) => void;
  actualizarCantidad: (id: string | number, cantidad: number) => void;
  vaciarCarrito: () => void;
  // Totales compatibles
  totalItems: number;
  subtotal: number;
  totalPrecio: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ItemCarrito[]>([]);

  useEffect(() => {
    const dataGuardada = localStorage.getItem("maktub_carrito");
    if (dataGuardada) {
      try {
        setItems(JSON.parse(dataGuardada));
      } catch (e) {
        console.error("Error al cargar carrito:", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("maktub_carrito", JSON.stringify(items));
  }, [items]);

  const agregarProducto = (producto: {
    id: number | string;
    nombre: string;
    precio: number;
    imagen_url?: string;
    categoria?: string;
  }) => {
    setItems((prev) => {
      const idStr = String(producto.id);
      const existe = prev.find((i) => String(i.id) === idStr && i.tipo !== "impresion");
      if (existe) {
        return prev.map((i) =>
          String(i.id) === idStr && i.tipo !== "impresion"
            ? { ...i, cantidad: i.cantidad + 1, precioTotal: (i.cantidad + 1) * i.precio }
            : i
        );
      }
      return [
        ...prev,
        {
          id: idStr,
          tipo: "producto",
          nombre: producto.nombre,
          precio: producto.precio,
          precioUnitario: producto.precio,
          precioTotal: producto.precio,
          imagen_url: producto.imagen_url,
          categoria: producto.categoria || "General",
          cantidad: 1,
        },
      ];
    });
  };

  const agregarAlCarrito = agregarProducto;

  const agregarImpresion = (detalle: DetalleImpresion) => {
    const nuevoItem: ItemCarrito = {
      id: `imp-${Date.now()}`,
      tipo: "impresion",
      nombre: `Impresión: ${detalle.nombreArchivo || "Documento"}`,
      precio: detalle.precioTotal,
      precioUnitario: detalle.precioUnitario,
      precioTotal: detalle.precioTotal,
      cantidad: 1,
      copias: detalle.copias,
      paginas: detalle.paginas,
      nombreArchivo: detalle.nombreArchivo,
      tamanoHoja: detalle.tamanoHoja,
      tipoPapel: detalle.tipoPapel,
      color: detalle.color,
      faz: detalle.faz,
      anillado: detalle.anillado,
      categoria: "Copiado",
    };

    setItems((prev) => [...prev, nuevoItem]);
  };

  const eliminarDelCarrito = (id: string | number) => {
    const idStr = String(id);
    setItems((prev) => prev.filter((i) => String(i.id) !== idStr));
  };

  const actualizarCantidad = (id: string | number, cantidad: number) => {
    if (cantidad <= 0) {
      eliminarDelCarrito(id);
      return;
    }
    const idStr = String(id);
    setItems((prev) =>
      prev.map((i) =>
        String(i.id) === idStr
          ? {
              ...i,
              cantidad,
              precioTotal: (i.precioUnitario || i.precio) * cantidad,
            }
          : i
      )
    );
  };

  const vaciarCarrito = () => setItems([]);

  const totalItems = items.reduce((acc, item) => acc + item.cantidad, 0);
  const subtotal = items.reduce(
    (acc, item) => acc + (item.precioTotal || item.precio * item.cantidad),
    0
  );
  const totalPrecio = subtotal;

  return (
    <CartContext.Provider
      value={{
        items,
        agregarProducto,
        agregarAlCarrito,
        agregarImpresion,
        eliminarDelCarrito,
        actualizarCantidad,
        vaciarCarrito,
        totalItems,
        subtotal,
        totalPrecio,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe ser usado dentro de un CartProvider");
  }
  return context;
}