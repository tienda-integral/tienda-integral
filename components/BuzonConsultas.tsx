"use client";

import { useState } from "react";

export default function BuzonConsultas() {
  const [tab, setTab] = useState<"no_encontrado" | "consulta">("no_encontrado");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [detalle, setDetalle] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre.trim() || !telefono.trim() || !detalle.trim()) {
      alert("Por favor completa tu nombre, teléfono y el detalle.");
      return;
    }

    setEnviando(true);

    try {
      await fetch("/api/consultas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: tab,
          nombre,
          telefono,
          productoBuscado: tab === "no_encontrado" ? detalle : null,
          mensaje: tab === "consulta" ? detalle : null,
        }),
      });

      const numeroWhatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5492604825533";
      const asunto =
        tab === "no_encontrado"
          ? "🔎 Consulta por producto que no encontré en la web"
          : "💬 Mensaje / Sugerencia";

      const texto = encodeURIComponent(
        `¡Hola Librería Maktub!\n\n` +
        `*${asunto}*\n` +
        `👤 *Nombre:* ${nombre}\n` +
        `📱 *Contacto:* ${telefono}\n` +
        `📝 *Detalle:* ${detalle}\n\n` +
        `¿Podrían confirmarme si lo tienen o pueden conseguirlo? ¡Muchas gracias!`
      );

      const url = `https://wa.me/${numeroWhatsapp}?text=${texto}`;
      window.open(url, "_blank");

      setEnviado(true);
      setDetalle("");
    } catch (err) {
      console.error(err);
      alert("No se pudo registrar la consulta, pero puedes escribirnos directamente por WhatsApp.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="max-w-5xl mx-auto px-4 pb-20">
      <div className="bg-gradient-to-br from-white to-stone-50 border border-stone-200 rounded-3xl p-6 sm:p-10 shadow-sm">
        
        {/* Pestañas estilo Maktub */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            type="button"
            onClick={() => { setTab("no_encontrado"); setEnviado(false); }}
            className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
              tab === "no_encontrado"
                ? "bg-teal-50 border-teal-200 text-teal-800 shadow-sm"
                : "bg-white border-stone-200 text-stone-600 hover:border-stone-300"
            }`}
          >
            🔎 ¿No encontraste lo que buscabas?
          </button>
          <button
            type="button"
            onClick={() => { setTab("consulta"); setEnviado(false); }}
            className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
              tab === "consulta"
                ? "bg-rose-50 border-rose-200 text-rose-800 shadow-sm"
                : "bg-white border-stone-200 text-stone-600 hover:border-stone-300"
            }`}
          >
            💬 Sugerencias y Observaciones
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-xl sm:text-2xl font-black text-stone-900">
            {tab === "no_encontrado"
              ? "¿Buscás un artículo específico que no viste publicado?"
              : "Buzón de Comentarios y Observaciones"}
          </h3>
          <p className="text-stone-600 text-xs sm:text-sm mt-1">
            {tab === "no_encontrado"
              ? "Decinos qué marca, modelo o tipo de material necesitás y te confirmamos disponibilidad en el local de San Rafael."
              : "Tu opinión nos ayuda a perfeccionar la atención, los precios y la rapidez de entrega."}
          </p>
        </div>

        {enviado ? (
          <div className="bg-teal-50 border border-teal-200 text-teal-800 p-5 rounded-2xl text-center">
            <p className="font-bold text-sm">¡Consulta enviada con éxito!</p>
            <p className="text-xs mt-1 text-teal-700">
              Se abrió la conversación de WhatsApp con el personal de la librería para coordinar tu pedido.
            </p>
            <button
              onClick={() => setEnviado(false)}
              className="mt-3 text-xs underline font-semibold text-stone-700 hover:text-stone-900"
            >
              Hacer otra consulta
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Tu Nombre
                </label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Sofía Martín"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="tel"
                  required
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej. 2604825533"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                {tab === "no_encontrado" ? "¿Qué artículo estás necesitando?" : "Tu mensaje"}
              </label>
              <textarea
                required
                rows={3}
                value={detalle}
                onChange={(e) => setDetalle(e.target.value)}
                placeholder={
                  tab === "no_encontrado"
                    ? "Ej. Block de hojas carta rayadas x 480 o cartulinas especiales color pastel..."
                    : "Dejanos tus sugerencias sobre la tienda o el servicio de copistería..."
                }
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-stone-200 text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={enviando}
                className="w-full sm:w-auto px-6 py-3 bg-teal-500 hover:bg-teal-600 active:scale-95 text-white font-bold rounded-2xl text-xs transition-all shadow-sm"
              >
                {enviando ? "Enviando..." : "Consultar por WhatsApp al Local →"}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}