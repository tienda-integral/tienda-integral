"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function InstitucionalPage() {
  const [institucion, setInstitucion] = useState("");
  const [contacto, setContacto] = useState("");
  const [email, setEmail] = useState("");
  const [tipoSolicitud, setTipoSolicitud] = useState("Presupuesto Institucional");
  const [detalle, setDetalle] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviadoExito, setEnviadoExito] = useState(false);

  // Línea exclusiva para Escuelas, Colegios e Instituciones
  const [whatsappInstitucional, setWhatsappInstitucional] = useState("5492604375234");

  useEffect(() => {
    async function cargarAjustes() {
      const { data } = await supabase
        .from("ajustes_tienda")
        .select("valor")
        .eq("clave", "whatsapp_institucional")
        .maybeSingle();

      if (data?.valor) {
        setWhatsappInstitucional(data.valor.replace(/\D/g, ""));
      }
    }
    cargarAjustes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);

    const { error } = await supabase.from("solicitudes_institucionales").insert([
      {
        institucion_o_nombre: institucion.trim(),
        contacto: contacto.trim(),
        email: email.trim(),
        tipo_solicitud: tipoSolicitud,
        detalle: detalle.trim(),
      },
    ]);

    setEnviando(false);
    if (!error) {
      setEnviadoExito(true);
    } else {
      alert("Hubo un error al enviar la solicitud: " + error.message);
    }
  };

  const handleConsultaRapidaWhatsapp = () => {
    const texto = encodeURIComponent(
      `¡Hola! Me comunico desde una escuela / institución para coordinar un presupuesto o lista escolar con Maktub.`
    );
    window.open(`https://wa.me/${whatsappInstitucional}?text=${texto}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-16">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 py-3 px-4 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 text-slate-950 rounded-xl flex items-center justify-center font-black text-sm">
              M
            </div>
            <span className="font-black text-slate-900 tracking-tight text-sm">
              MAKTUB • Canal Exclusivo Escuelas & Organismos
            </span>
          </div>
          <Link
            href="/tienda"
            className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
          >
            ← Volver a la Tienda
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* ENCABEZADO */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
            Convenios & Atención Directa B2B
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
            Presupuestos y Listas Escolares
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Canal directo para directivos, cooperadoras, docentes y dependencias públicas. Facturación oficial A y B con precios mayoristas.
          </p>
        </div>

        {/* CARTEL VERDE DESTACADO DE WHATSAPP DIRECTO */}
        <div className="bg-emerald-600 text-white p-5 sm:p-6 rounded-3xl shadow-md mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shrink-0">
              🏫
            </div>
            <div>
              <h2 className="text-base font-black leading-tight">
                Línea Directa para Escuelas e Instituciones
              </h2>
              <p className="text-emerald-100 text-xs mt-0.5">
                Envianos tu lista, foto o consulta al WhatsApp oficial de atención institucional.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleConsultaRapidaWhatsapp}
            className="w-full sm:w-auto bg-white text-emerald-800 hover:bg-emerald-50 font-black px-5 py-3 rounded-2xl text-xs transition-all shadow shrink-0 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>💬 Contactar al 260 437-5234</span>
            <span>↗</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* BENEFICIOS */}
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="font-black text-sm text-slate-900 mb-1">📄 Factura A y B Oficial</h3>
              <p className="text-xs text-slate-500">
                Comprobantes requeridos para rendiciones de cooperadoras y subsidios educativos.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="font-black text-sm text-slate-900 mb-1">📦 Precios por Bulto Cerrado</h3>
              <p className="text-xs text-slate-500">
                Resmas de papel, afiches, cartulinas, adhesivos y descartables al por mayor.
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <h3 className="font-black text-sm text-slate-900 mb-1">🚚 Entrega Coordinada</h3>
              <p className="text-xs text-slate-500">
                Despacho en establecimiento o pedido embalado listo para retirar en local.
              </p>
            </div>
          </div>

          {/* FORMULARIO */}
          <div className="md:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs">
            {enviadoExito ? (
              <div className="text-center py-10 space-y-3">
                <div className="text-4xl">✅</div>
                <h3 className="text-lg font-black text-slate-900">
                  ¡Solicitud Enviada con Éxito!
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  La recibimos en nuestro sistema administrativo. Te responderemos a la brevedad con la cotización correspondiente.
                </p>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEnviadoExito(false);
                      setDetalle("");
                      setInstitucion("");
                    }}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs"
                  >
                    Cargar otra solicitud
                  </button>
                  <button
                    type="button"
                    onClick={handleConsultaRapidaWhatsapp}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs"
                  >
                    Avisar al WhatsApp Institucional 💬
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-sm font-black text-slate-900">
                    O solicitá tu presupuesto por escrito:
                  </h3>
                  <span className="text-[11px] text-slate-400">Cotización formal</span>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                    Institución, Escuela o Dependencia
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Escuela N° 12 / Cooperadora"
                    value={institucion}
                    onChange={(e) => setInstitucion(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                      Teléfono de Contacto
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="ej. 260 411-2233"
                      value={contacto}
                      onChange={(e) => setContacto(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                      Correo Electrónico (Opcional)
                    </label>
                    <input
                      type="email"
                      placeholder="escuela@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                    Tipo de Requerimiento
                  </label>
                  <select
                    value={tipoSolicitud}
                    onChange={(e) => setTipoSolicitud(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 font-medium"
                  >
                    <option value="Presupuesto Institucional">Presupuesto Formal para Institución</option>
                    <option value="Lista Escolar">Lista de Útiles Escolar</option>
                    <option value="Compra Mayorista">Compra Mayorista / Descartables</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-700 mb-1">
                    Detalle de productos y cantidades estimadas
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Pegá aquí la lista o describí las cantidades y marcas deseadas..."
                    value={detalle}
                    onChange={(e) => setDetalle(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={enviando}
                  className="w-full bg-slate-950 hover:bg-slate-900 text-white font-black py-3 rounded-2xl text-xs transition-all shadow-md cursor-pointer"
                >
                  {enviando ? "Enviando solicitud..." : "Solicitar Presupuesto Formal"}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}