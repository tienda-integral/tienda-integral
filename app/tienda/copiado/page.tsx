'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ItemCopia {
  id: string;
  nombre: string;
  precio: number;
  categoria: string;
}

export default function AdministradorCopiadoPage() {
  const [items, setItems] = useState<ItemCopia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    cargarPrecios();
  }, []);

  async function cargarPrecios() {
    setCargando(true);
    const { data, error } = await supabase
      .from('configuracion_copias')
      .select('*')
      .order('categoria', { ascending: true });

    if (!error && data) {
      setItems(data);
    }
    setCargando(false);
  }

  function handlePrecioChange(id: string, nuevoPrecio: number) {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, precio: nuevoPrecio } : item))
    );
  }

  async function guardarCambios() {
    setGuardando(true);
    setMensaje(null);

    for (const item of items) {
      await supabase
        .from('configuracion_copias')
        .update({ precio: item.precio, updated_at: new Date().toISOString() })
        .eq('id', item.id);
    }

    setGuardando(false);
    setMensaje('¡Precios de copias actualizados correctamente!');
    setTimeout(() => setMensaje(null), 4000);
  }

  if (cargando) {
    return (
      <div className="p-8 text-center text-gray-500">
        Cargando tarifas de copiado...
      </div>
    );
  }

  const categorias = Array.from(new Set(items.map((i) => i.categoria)));

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Configuración de Tarifas de Copiado (Maktub Express)
          </h1>
          <p className="text-sm text-gray-500">
            Modificá los precios unitarios de impresión, copiado y encuadernación.
          </p>
        </div>
        <button
          onClick={guardarCambios}
          disabled={guardando}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-xl shadow transition active:scale-95 disabled:opacity-50"
        >
          {guardando ? 'Guardando...' : 'Guardar Modificaciones'}
        </button>
      </div>

      {mensaje && (
        <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 font-medium">
          {mensaje}
        </div>
      )}

      <div className="space-y-6">
        {categorias.map((cat) => (
          <div key={cat} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-700 mb-4 pb-2 border-b">
              {cat}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items
                .filter((item) => item.categoria === cat)
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200"
                  >
                    <span className="text-sm font-medium text-gray-700 pr-2">
                      {item.nombre}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500 font-bold">$</span>
                      <input
                        type="number"
                        value={item.precio}
                        onChange={(e) =>
                          handlePrecioChange(item.id, parseFloat(e.target.value) || 0)
                        }
                        className="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-right font-bold text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}