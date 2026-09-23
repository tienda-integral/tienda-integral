'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface Producto {
  id: string;
  nombre: string;
  rubro?: string;
  categoria?: string;
  precio_venta: number;
  precio_costo?: number;
  stock?: number;
  imagen_url?: string;
  es_oferta?: boolean;
  texto_distintivo?: string;
  color_distintivo?: string;
}

export default function TiendaAdminPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [soloOfertas, setSoloOfertas] = useState(false);
  const [usuarioEmail, setUsuarioEmail] = useState<string>('jrsfernandez@yahoo.com.ar');

  useEffect(() => {
    cargarProductos();
    obtenerSesion();
  }, []);

  async function obtenerSesion() {
    const { data } = await supabase.auth.getUser();
    if (data?.user?.email) {
      setUsuarioEmail(data.user.email);
    }
  }

  async function cargarProductos() {
    setCargando(true);
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('nombre', { ascending: true });

    if (!error && data) {
      setProductos(data);
    }
    setCargando(false);
  }

  async function handleToggleOferta(prod: Producto) {
    const nuevoEstado = !prod.es_oferta;
    const { error } = await supabase
      .from('productos')
      .update({ es_oferta: nuevoEstado })
      .eq('id', prod.id);

    if (!error) {
      setProductos((prev) =>
        prev.map((p) => (p.id === prod.id ? { ...p, es_oferta: nuevoEstado } : p))
      );
    }
  }

  async function handleBorrar(id: string) {
    if (!confirm('¿Seguro que deseas eliminar este producto?')) return;
    const { error } = await supabase.from('productos').delete().eq('id', id);
    if (!error) {
      setProductos((prev) => prev.filter((p) => p.id !== id));
    }
  }

  async function handleCerrarSesion() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  // Filtros de búsqueda
  const productosFiltrados = productos.filter((item) => {
    const coincideTexto = item.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria =
      filtroCategoria === 'todas' ||
      item.categoria?.toLowerCase() === filtroCategoria.toLowerCase() ||
      item.rubro?.toLowerCase() === filtroCategoria.toLowerCase();
    const coincideOferta = !soloOfertas || Boolean(item.es_oferta);

    return coincideTexto && coincideCategoria && coincideOferta;
  });

  const totalOfertas = productos.filter((p) => p.es_oferta).length;

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 md:p-8 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Cabecera Principal */}
        <header className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                Catálogo de Productos
              </h1>
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                {productosFiltrados.length} en vista
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Gestioná tu escaparate, cambiá promociones y controlá stocks de manera visual.
            </p>
          </div>

          {/* Botonera de acciones superiores */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full lg:w-auto justify-start lg:justify-end">
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-2xl border border-slate-200 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-semibold text-slate-700 truncate max-w-[170px]">
                {usuarioEmail}
              </span>
              <span className="bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-lg text-[10px]">
                DUEÑO / ADMIN
              </span>
            </div>

            <Link
              href="/tienda/nuevo"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm flex items-center gap-1.5"
            >
              + Nuevo
            </Link>

            {/* BOTÓN NUEVO: ACCESO A TARIFAS DE COPIADO */}
            <Link
              href="/tienda/copiado"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm flex items-center gap-1.5"
            >
              📄 Tarifas de Copias
            </Link>

            <Link
              href="/"
              target="_blank"
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-1"
            >
              Tienda ↗
            </Link>

            <button
              onClick={handleCerrarSesion}
              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold px-3.5 py-2 rounded-xl transition"
            >
              Salir
            </button>
          </div>
        </header>

        {/* Barra de Filtros */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 sm:w-64">
              <span className="absolute left-3.5 top-2.5 text-slate-400 text-xs">🔍</span>
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="todas">Todas las categorías</option>
              <option value="libreria">Librería</option>
              <option value="escolar">Escolar</option>
              <option value="artistica">Artística</option>
              <option value="comercial">Comercial</option>
            </select>

            <button
              onClick={() => setSoloOfertas(!soloOfertas)}
              className={`py-2 px-3.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                soloOfertas
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              🔥 Solo Ofertas ({totalOfertas})
            </button>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 self-end md:self-auto">
            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-white text-slate-800 shadow-sm">
              🖼️ Galería Visual
            </span>
          </div>
        </div>

        {/* Cuadrícula de Tarjetas de Productos */}
        {cargando ? (
          <div className="p-12 text-center text-slate-400 font-medium">
            Cargando catálogo...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {productosFiltrados.map((prod) => (
              <div
                key={prod.id}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between relative group"
              >
                {/* Distintivo de Oferta si está activo */}
                {prod.es_oferta && (
                  <span className="absolute top-4 right-4 z-10 bg-amber-400 text-slate-900 text-[10px] font-black px-2.5 py-1 rounded-lg shadow-sm">
                    {prod.texto_distintivo || 'OFERTA'}
                  </span>
                )}

                <div>
                  {/* Foto o ícono */}
                  <div className="w-full h-44 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 overflow-hidden relative border border-slate-100">
                    {prod.imagen_url ? (
                      <Image
                        src={prod.imagen_url}
                        alt={prod.nombre}
                        fill
                        className="object-contain p-2"
                      />
                    ) : (
                      <div className="text-center text-slate-300">
                        <span className="text-3xl block mb-1">🎁</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          Sin imagen
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Rubro y Stock */}
                  <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
                    <span className="text-blue-600 uppercase tracking-wider">
                      {prod.rubro || prod.categoria || 'GENERAL'}
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md text-[10px]">
                      Stock: {prod.stock ?? 0}
                    </span>
                  </div>

                  {/* Nombre */}
                  <h3 className="font-bold text-slate-800 text-sm mb-3 line-clamp-2 leading-snug">
                    {prod.nombre}
                  </h3>
                </div>

                {/* Precios y Botones */}
                <div>
                  <div className="flex items-baseline justify-between mb-4 border-t border-slate-100 pt-3">
                    <span className="text-xl font-black text-slate-900">
                      ${prod.precio_venta.toLocaleString('es-AR')}
                    </span>
                    {prod.precio_costo ? (
                      <span className="text-xs text-slate-400 font-semibold">
                        Costo: ${prod.precio_costo.toLocaleString('es-AR')}
                      </span>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => handleToggleOferta(prod)}
                      className={`w-full py-1.5 rounded-xl text-xs font-bold border transition ${
                        prod.es_oferta
                          ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {prod.es_oferta ? '🔥 En Oferta (quitar)' : '☆ Marcar Oferta'}
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                      <Link
                        href={`/tienda/editar/${prod.id}`}
                        className="py-1.5 rounded-xl text-xs font-bold text-center bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition"
                      >
                        ✏️ Editar
                      </Link>
                      <button
                        onClick={() => handleBorrar(prod.id)}
                        className="py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100 transition"
                      >
                        🗑️ Borrar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}