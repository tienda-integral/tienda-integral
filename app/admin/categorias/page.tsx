"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Categoria {
  id: number;
  nombre: string;
  icono: string;
  subcategorias: string[];
}

export default function AdminCategoriasPage() {
  const router = useRouter();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [usuarioEmail, setUsuarioEmail] = useState("");
  const [esAdmin, setEsAdmin] = useState(false);

  // Formulario nueva categoría
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoIcono, setNuevoIcono] = useState("📦");
  const [nuevaSubcatTexto, setNuevaSubcatTexto] = useState("");

  // Manejo de edición rápida de subcategoría
  const [subcatInputs, setSubcatInputs] = useState<Record<number, string>>({});

  useEffect(() => {
    async function verificarYcargar() {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: perfil } = await supabase
        .from("perfiles")
        .select("email, rol")
        .eq("id", user.id)
        .maybeSingle();

      if (!perfil || perfil.rol === "cliente") {
        router.push("/login");
        return;
      }

      setUsuarioEmail(perfil.email);
      setEsAdmin(perfil.rol === "admin");
      cargarCategorias();
    }

    verificarYcargar();
  }, [router]);

  const cargarCategorias = async () => {
    setCargando(true);
    const { data, error } = await supabase
      .from("categorias")
      .select("*")
      .order("id", { ascending: true });

    if (!error && data) {
      setCategorias(data);
    }
    setCargando(false);
  };

  const handleCrearCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) return;

    const subcats = nuevaSubcatTexto
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const { data, error } = await supabase
      .from("categorias")
      .insert([
        {
          nombre: nuevoNombre.trim(),
          icono: nuevoIcono.trim() || "📦",
          subcategorias: subcats,
        },
      ])
      .select();

    if (error) {
      alert("Error al crear categoría: " + error.message);
      return;
    }

    if (data) {
      setCategorias((prev) => [...prev, data[0]]);
      setNuevoNombre("");
      setNuevoIcono("📦");
      setNuevaSubcatTexto("");
    }
  };

  const handleAgregarSubcategoria = async (cat: Categoria) => {
    const texto = (subcatInputs[cat.id] || "").trim();
    if (!texto) return;

    if (cat.subcategorias.includes(texto)) {
      alert("Esta subcategoría ya existe.");
      return;
    }

    const subcategoriasActualizadas = [...cat.subcategorias, texto];

    const { error } = await supabase
      .from("categorias")
      .update({ subcategorias: subcategoriasActualizadas })
      .eq("id", cat.id);

    if (error) {
      alert("Error al agregar subcategoría: " + error.message);
      return;
    }

    setCategorias((prev) =>
      prev.map((c) =>
        c.id === cat.id ? { ...c, subcategorias: subcategoriasActualizadas } : c
      )
    );

    setSubcatInputs((prev) => ({ ...prev, [cat.id]: "" }));
  };

  const handleQuitarSubcategoria = async (cat: Categoria, subcatAeliminar: string) => {
    if (!confirm(`¿Eliminar la subcategoría "${subcatAeliminar}" de ${cat.nombre}?`)) return;

    const subcategoriasActualizadas = cat.subcategorias.filter((s) => s !== subcatAeliminar);

    const { error } = await supabase
      .from("categorias")
      .update({ subcategorias: subcategoriasActualizadas })
      .eq("id", cat.id);

    if (error) {
      alert("Error al quitar subcategoría: " + error.message);
      return;
    }

    setCategorias((prev) =>
      prev.map((c) =>
        c.id === cat.id ? { ...c, subcategorias: subcategoriasActualizadas } : c
      )
    );
  };

  const handleEliminarCategoria = async (cat: Categoria) => {
    if (!esAdmin) {
      alert("Solo el Administrador puede eliminar categorías completas.");
      return;
    }

    if (
      !confirm(
        `¿Estás seguro de eliminar "${cat.nombre}"? Esto no borrará los productos, pero perderán su asignación directa.`
      )
    )
      return;

    const { error } = await supabase.from("categorias").delete().eq("id", cat.id);

    if (error) {
      alert("Error al eliminar categoría: " + error.message);
      return;
    }

    setCategorias((prev) => prev.filter((c) => c.id !== cat.id));
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto">
        
        {/* BARRA SUPERIOR DE NAVEGACIÓN ADMINISTRATIVA */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🏷️</span>
              <h1 className="text-2xl font-black text-slate-900">Gestor de Categorías y Rubros</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Administrá los rubros principales y las subcategorías que alimentan la tienda y el catálogo.
            </p>
          </div>

          {/* Menú de módulos admin */}
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/admin/productos"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors"
            >
              📦 Productos
            </Link>
            <Link
              href="/admin/categorias"
              className="bg-blue-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-xs"
            >
              🏷️ Categorías
            </Link>
            <Link
              href="/admin/copiado"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors"
            >
              🖨️ Copiado
            </Link>
            <Link
              href="/admin/envios"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors"
            >
              🚚 Envíos
            </Link>
            <Link
              href="/tienda"
              target="_blank"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors"
            >
              Tienda ↗
            </Link>
          </div>
        </div>

        {/* CONTENEDOR: FORMULARIO + LISTADO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* PANEL IZQUIERDO: CREAR NUEVA CATEGORÍA */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs h-fit">
            <h2 className="text-base font-black text-slate-900 mb-1 flex items-center gap-2">
              <span>+</span> Nueva Categoría
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Agregá un rubro para que aparezca en el menú y catálogo.
            </p>

            <form onSubmit={handleCrearCategoria} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Ícono o Emoji
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={nuevoIcono}
                  onChange={(e) => setNuevoIcono(e.target.value)}
                  className="w-20 px-3 py-2 text-center text-lg border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="📚"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Nombre del Rubro
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Marroquinería, Bellas Artes..."
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Subcategorías iniciales (separadas por coma)
                </label>
                <textarea
                  rows={3}
                  placeholder="ej. Mochilas, Cartucheras, Billeteras"
                  value={nuevaSubcatTexto}
                  onChange={(e) => setNuevaSubcatTexto(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-xs"
              >
                Crear Categoría
              </button>
            </form>
          </div>

          {/* PANEL DERECHO: CATEGORÍAS Y SUS SUBCATEGORÍAS */}
          <div className="lg:col-span-2 space-y-4">
            {cargando ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
                <p className="text-slate-400 font-bold text-xs animate-pulse">Cargando categorías...</p>
              </div>
            ) : categorias.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center">
                <p className="text-slate-400 font-bold text-xs">No hay categorías configuradas aún.</p>
              </div>
            ) : (
              categorias.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl p-2 bg-slate-100 rounded-xl">{cat.icono || "📦"}</span>
                      <div>
                        <h3 className="text-base font-black text-slate-900 leading-tight">
                          {cat.nombre}
                        </h3>
                        <span className="text-[11px] text-slate-400 font-semibold">
                          {cat.subcategorias?.length || 0} subcategorías registradas
                        </span>
                      </div>
                    </div>

                    {esAdmin && (
                      <button
                        type="button"
                        onClick={() => handleEliminarCategoria(cat)}
                        className="text-slate-400 hover:text-rose-600 text-xs font-bold px-2 py-1 rounded-lg transition-colors"
                        title="Eliminar categoría completa"
                      >
                        🗑️ Eliminar
                      </button>
                    )}
                  </div>

                  {/* Lista de chips de subcategorías */}
                  <div className="flex flex-wrap gap-1.5 mb-3.5">
                    {cat.subcategorias && cat.subcategorias.length > 0 ? (
                      cat.subcategorias.map((sub) => (
                        <span
                          key={sub}
                          className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-lg transition-colors"
                        >
                          <span>{sub}</span>
                          <button
                            type="button"
                            onClick={() => handleQuitarSubcategoria(cat, sub)}
                            className="text-slate-400 hover:text-rose-600 font-black ml-0.5"
                            title="Quitar subcategoría"
                          >
                            ×
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 text-xs italic">
                        Sin subcategorías aún.
                      </span>
                    )}
                  </div>

                  {/* Input rápido para agregar subcategoría a esta categoría */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <input
                      type="text"
                      placeholder={`+ Agregar subcategoría a ${cat.nombre}...`}
                      value={subcatInputs[cat.id] || ""}
                      onChange={(e) =>
                        setSubcatInputs((prev) => ({ ...prev, [cat.id]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAgregarSubcategoria(cat);
                        }
                      }}
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleAgregarSubcategoria(cat)}
                      className="bg-slate-900 hover:bg-blue-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-colors shrink-0"
                    >
                      + Sumar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

      </div>
    </main>
  );
}