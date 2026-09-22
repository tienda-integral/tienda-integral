"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Solicitud {
  id: number;
  institucion_o_nombre: string;
  contacto: string;
  email?: string;
  tipo_solicitud: string;
  detalle: string;
  estado: "Pendiente" | "En Cotización" | "Enviado" | "Cerrado";
  created_at: string;
}

export default function AdminInstitucionalPage() {
  const router = useRouter();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cargando, setCargando] = useState(true);

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
        .select("rol")
        .eq("id", user.id)
        .maybeSingle();

      if (!perfil || perfil.rol === "cliente") {
        router.push("/login");
        return;
      }

      cargarSolicitudes();
    }

    verificarYcargar();
  }, [router]);

  const cargarSolicitudes = async () => {
    setCargando(true);
    const { data } = await supabase
      .from("solicitudes_institucionales")
      .select("*")
      .order("id", { ascending: false });

    if (data) setSolicitudes(data as Solicitud[]);
    setCargando(false);
  };

  const handleCambiarEstado = async (id: number, nuevoEstado: Solicitud["estado"]) => {
    const { error } = await supabase
      .from("solicitudes_institucionales")
      .update({ estado: nuevoEstado })
      .eq("id", id);

    if (!error) {
      setSolicitudes((prev) =>
        prev.map((s) => (s.id === id ? { ...s, estado: nuevoEstado } : s))
      );
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🏫</span>
              <h1 className="text-2xl font-black text-slate-900">
                Solicitudes de Escuelas & Presupuestos
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Revisá pedidos de cotización, listas escolares y contactos institucionales.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href="/admin/productos"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors"
            >
              📦 Productos
            </Link>
            <Link
              href="/admin/categorias"
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors"
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
              href="/admin/institucional"
              className="bg-blue-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs shadow-xs"
            >
              🏫 Institucional
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {cargando ? (
            <div className="p-12 text-center text-slate-400 text-xs font-bold animate-pulse">
              Cargando solicitudes...
            </div>
          ) : solicitudes.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No hay solicitudes pendientes por el momento.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {solicitudes.map((s) => (
                <div key={s.id} className="p-5 flex flex-col md:flex-row justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-slate-900 text-sm">
                        {s.institucion_o_nombre}
                      </span>
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {s.tipo_solicitud}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(s.created_at).toLocaleDateString("es-AR")}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-line">
                      {s.detalle}
                    </p>

                    <div className="flex items-center gap-3 pt-1 text-xs text-slate-500">
                      <span>📞 {s.contacto}</span>
                      {s.email && <span>✉️ {s.email}</span>}
                    </div>
                  </div>

                  <div className="flex md:flex-col justify-between items-end gap-2 shrink-0">
                    <select
                      value={s.estado}
                      onChange={(e) =>
                        handleCambiarEstado(s.id, e.target.value as Solicitud["estado"])
                      }
                      className="border border-slate-300 rounded-xl px-2.5 py-1 text-xs font-bold bg-white text-slate-700"
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="En Cotización">En Cotización</option>
                      <option value="Enviado">Enviado</option>
                      <option value="Cerrado">Cerrado</option>
                    </select>

                    <a
                      href={`https://wa.me/${s.contacto.replace(/\D/g, "")}?text=${encodeURIComponent(
                        `¡Hola! Nos comunicamos desde Librería Maktub por tu solicitud institucional (${s.tipo_solicitud}).`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-colors flex items-center gap-1 shadow-xs"
                    >
                      <span>Responder</span>
                      <span>💬</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}