"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart, ItemCarrito } from "@/lib/context/CartContext";

const DATOS_BANCARIOS = {
  alias: "abisas.nacion",
  cbu: "0110485520048503656133",
  titular: "ABI SAS",
  banco: "Banco Nación",
};

const DATOS_MERCADOPAGO = {
  alias: "libreriamaktub.mp",
  cvu: "0000003100080010806726",
  titular: "Juan Roberto Sanchez",
};

export default function CheckoutPage() {
  const { items, totalPrecio, vaciarCarrito } = useCart();

  const [cliente, setCliente] = useState({
    nombre: "",
    telefono: "",
    email: "",
    direccion: "",
    notas: "",
  });

  const [metodoEntrega, setMetodoEntrega] = useState<"retiro" | "envio">("retiro");
  const [metodoPago, setMetodoPago] = useState<"transferencia" | "efectivo" | "online">("transferencia");
  const [cargando, setCargando] = useState(false);
  const [pedidoId, setPedidoId] = useState<number | null>(null);

  // Monto congelado para evitar que el vaciado del carrito lo pase a $0
  const [montoCongelado, setMontoCongelado] = useState<number>(0);
  const [aliasBancoCopiado, setAliasBancoCopiado] = useState(false);
  const [aliasMpCopiado, setAliasMpCopiado] = useState(false);

  // Enlace en caso de que responda la API de preferencia
  const [mpInitPoint, setMpInitPoint] = useState<string | null>(null);

  // Cálculo del subtotal: si totalPrecio viene en 0, calcula sumando los ítems
  const sumaManual = (items || []).reduce((acc: number, it: any) => {
    const precio = Number(it.precio || it.precioUnitario || 0);
    const cant = Number(it.cantidad || it.copias || 1);
    return acc + precio * cant;
  }, 0);

  const subtotal = totalPrecio > 0 ? totalPrecio : sumaManual;
  const aplicaDescuento = metodoPago === "transferencia" || metodoPago === "efectivo";
  const descuento = aplicaDescuento ? Math.round(subtotal * 0.1) : 0;
  const totalCalculado = Math.max(0, subtotal - descuento);

  const copiarAliasBanco = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(DATOS_BANCARIOS.alias);
      setAliasBancoCopiado(true);
      setTimeout(() => setAliasBancoCopiado(false), 2500);
    }
  };

  const copiarAliasMp = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(DATOS_MERCADOPAGO.alias);
      setAliasMpCopiado(true);
      setTimeout(() => setAliasMpCopiado(false), 2500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const montoFinal = totalCalculado;

    if (!cliente.nombre.trim() || !cliente.telefono.trim()) {
      alert("Por favor completa tu Nombre y Teléfono.");
      return;
    }

    if (metodoEntrega === "envio" && !cliente.direccion.trim()) {
      alert("Por favor indica la dirección para el envío en San Rafael.");
      return;
    }

    if (montoFinal <= 0) {
      alert("El carrito está vacío o el total es $0. Agrega productos antes de confirmar.");
      return;
    }

    setCargando(true);
    setMontoCongelado(montoFinal);

    try {
      const payload = {
        cliente: {
          nombre: cliente.nombre,
          telefono: cliente.telefono,
          email: cliente.email,
        },
        pedido: {
          metodoEntrega,
          direccionEnvio: metodoEntrega === "envio" ? cliente.direccion : null,
          metodoPago,
          subtotal,
          descuento,
          total: montoFinal,
          notas: cliente.notas,
        },
        items: items.map((item: ItemCarrito) => {
          if (item.tipo === "producto") {
            return {
              tipo: "producto",
              nombre: item.nombre,
              cantidad: item.cantidad,
              precioUnitario: item.precio,
              precioTotal: item.precio * item.cantidad,
              detallesTecnicos: item.categoria || null,
            };
          } else {
            return {
              tipo: "impresion",
              nombre: `Impresión: ${item.nombreArchivo}`,
              cantidad: item.copias,
              precioUnitario: item.precioUnitario,
              precioTotal: item.precioTotal,
              detallesTecnicos: `${item.tamanoHoja}, ${item.tipoPapel}, ${item.color}, ${item.faz}${
                item.anillado ? ", Con anillado" : ""
              }`,
            };
          }
        }),
      };

      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resTexto = await res.text();
      let data: any;
      try {
        data = JSON.parse(resTexto);
      } catch {
        throw new Error("El servidor devolvió una respuesta no válida al registrar el pedido.");
      }

      if (!res.ok) {
        throw new Error(data.error || "No se pudo registrar el pedido.");
      }

      const nuevoId = data.id;
      setPedidoId(nuevoId);

      // Si seleccionó Mercado Pago, intenta generar preferencia si la API estuviera activa
      if (metodoPago === "online") {
        try {
          const mpRes = await fetch("/api/pagos/mercadopago", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pedidoId: nuevoId,
              total: montoFinal,
              cliente,
            }),
          });
          const mpData = await mpRes.json();
          if (mpData && (mpData.initPoint || mpData.init_point)) {
            setMpInitPoint(mpData.initPoint || mpData.init_point);
          }
        } catch {
          // Si la API arroja UNAUTHORIZED, continúa sin problemas usando el QR directo
        }
      }

      vaciarCarrito();
    } catch (err: any) {
      alert(`Detalle: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  // --- Pantalla de Confirmación de Éxito ---
  if (pedidoId !== null) {
    const numeroWhatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5492604825533";

    const mensajeWhatsapp = encodeURIComponent(
      `¡Hola Maktub! Acabo de registrar el Pedido #${pedidoId} en la web.\n\n` +
      `👤 *Cliente:* ${cliente.nombre}\n` +
      `📱 *Teléfono:* ${cliente.telefono}\n` +
      `📦 *Entrega:* ${metodoEntrega === "envio" ? `Envío a domicilio (${cliente.direccion})` : "Retiro en local (Centro)"}\n` +
      `💳 *Pago:* ${metodoPago === "transferencia" ? "Transferencia Banco Nación (-10%)" : metodoPago === "efectivo" ? "Efectivo (-10%)" : "Mercado Pago (QR / CVU)"}\n` +
      `💰 *Total final:* $${montoCongelado.toLocaleString("es-AR")}\n\n` +
      (cliente.notas ? `📝 *Nota:* ${cliente.notas}\n\n` : "") +
      (metodoPago !== "efectivo" ? `Adjunto el comprobante a continuación.\n\n` : "") +
      `Envío este mensaje para coordinar la preparación. ¡Muchas gracias!`
    );

    const urlWhatsapp = `https://wa.me/${numeroWhatsapp}?text=${mensajeWhatsapp}`;

    // Payload de QR interoperable directo al CVU de Mercado Pago
    const qrData =
      mpInitPoint ||
      `00020101021243650014ar.gob.bcv.cbu0122${DATOS_MERCADOPAGO.cvu}520400005303032540${montoCongelado}.005802AR5919JUAN ROBERTO SANCHEZ6011SAN RAFAEL62070503***6304`;

    return (
      <main className="min-h-screen bg-[#FAF9F6] py-12 px-4 font-sans text-stone-800">
        <div className="max-w-xl mx-auto bg-white p-8 rounded-3xl border border-stone-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold border border-teal-200">
            ✓
          </div>
          <h1 className="text-2xl font-black text-stone-900 mb-2">
            ¡Pedido Registrado con Éxito!
          </h1>
          <p className="text-stone-600 mb-6 text-sm">
            Tu número de orden es <span className="font-bold text-stone-900">#{pedidoId}</span>.
          </p>

          <div className="bg-stone-50 rounded-2xl p-5 text-left border border-stone-200 mb-6 text-xs sm:text-sm text-stone-700 space-y-1.5">
            <p><span className="font-semibold text-stone-900">Cliente:</span> {cliente.nombre}</p>
            <p><span className="font-semibold text-stone-900">Teléfono:</span> {cliente.telefono}</p>
            <p><span className="font-semibold text-stone-900">Modalidad:</span> {metodoEntrega === "envio" ? `Envío a domicilio (${cliente.direccion})` : "Retiro en local (Centro)"}</p>
            <p><span className="font-semibold text-stone-900">Forma de pago:</span> {metodoPago === "transferencia" ? "Transferencia (-10%)" : metodoPago === "efectivo" ? "Efectivo (-10%)" : "Mercado Pago"}</p>
            <p className="text-base font-black text-stone-900 pt-3 border-t border-stone-200 flex justify-between items-center">
              <span>Total final a pagar:</span>
              <span className="text-teal-600 font-extrabold">${montoCongelado.toLocaleString("es-AR")}</span>
            </p>
          </div>

          {/* Bloque QR Dinámico Mercado Pago */}
          {metodoPago === "online" && (
            <div className="bg-sky-50 border border-sky-200 rounded-3xl p-6 text-center mb-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl">💳</span>
                <span className="font-bold text-sky-950 text-sm">
                  Cobro con Mercado Pago
                </span>
              </div>

              <div className="space-y-3">
                <div className="bg-white p-3 rounded-2xl inline-block border border-sky-200 shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                      qrData
                    )}`}
                    alt="Código QR de Mercado Pago"
                    className="w-48 h-48 mx-auto rounded-lg"
                  />
                </div>

                <div className="max-w-xs mx-auto text-xs text-stone-600 space-y-2">
                  <p>
                    Escaneá el código QR desde tu app de <strong>Mercado Pago</strong> o cualquier billetera virtual por el total de <strong>${montoCongelado.toLocaleString("es-AR")}</strong>.
                  </p>

                  <div className="bg-white/80 border border-sky-200 rounded-2xl p-3 text-left space-y-1 text-[11px] shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 font-medium">Alias Mercado Pago:</span>
                      <button
                        type="button"
                        onClick={copiarAliasMp}
                        className="px-2 py-0.5 bg-sky-100 hover:bg-sky-200 text-sky-800 font-bold rounded-md transition-all text-[10px]"
                      >
                        {aliasMpCopiado ? "✓ Copiado" : "Copiar"}
                      </button>
                    </div>
                    <p className="font-mono font-bold text-sky-950 text-xs">{DATOS_MERCADOPAGO.alias}</p>
                    <p className="text-stone-600 pt-0.5">
                      <strong>CVU:</strong> <span className="font-mono text-[10px]">{DATOS_MERCADOPAGO.cvu}</span>
                    </p>
                    <p className="text-stone-600">
                      <strong>Titular:</strong> {DATOS_MERCADOPAGO.titular}
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <a
                    href="https://link.mercadopago.com.ar/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block w-full py-3 px-4 bg-[#009EE3] hover:bg-[#0089c7] text-white font-bold rounded-2xl text-xs transition-all shadow-sm active:scale-95"
                  >
                    Abrir App de Mercado Pago →
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Bloque Transferencia Banco Nación */}
          {metodoPago === "transferencia" && (
            <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-4 text-left mb-6 text-xs text-stone-700 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-teal-800 uppercase tracking-wider text-[11px]">
                  Datos para transferir
                </span>
                <button
                  type="button"
                  onClick={copiarAliasBanco}
                  className="px-2.5 py-1 bg-white border border-teal-300 rounded-lg text-teal-700 font-bold text-[11px] hover:bg-teal-100 transition-all shadow-sm"
                >
                  {aliasBancoCopiado ? "✓ ¡Copiado!" : "Copiar Alias"}
                </button>
              </div>
              <p><strong className="text-stone-900">Alias:</strong> <span className="font-mono font-bold text-teal-900">{DATOS_BANCARIOS.alias}</span></p>
              <p><strong className="text-stone-900">CBU:</strong> <span className="font-mono text-[11px]">{DATOS_BANCARIOS.cbu}</span></p>
              <p><strong className="text-stone-900">Titular:</strong> {DATOS_BANCARIOS.titular} ({DATOS_BANCARIOS.banco})</p>
              <p className="text-[11px] text-teal-800 pt-1">
                📌 Luego de transferir, envíanos el comprobante por WhatsApp presionando el botón de abajo.
              </p>
            </div>
          )}

          <a
            href={urlWhatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full py-4 px-6 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-2xl shadow-sm transition-all text-sm mb-3"
          >
            <span>Enviar orden al WhatsApp de la Librería →</span>
          </a>

          <Link
            href="/"
            className="inline-block text-xs text-stone-500 hover:text-stone-800 transition-colors underline"
          >
            Volver a la portada principal
          </Link>
        </div>
      </main>
    );
  }

  // --- Formulario Principal de Checkout ---
  return (
    <main className="min-h-screen bg-[#FAF9F6] py-10 px-4 font-sans text-stone-800">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-black text-stone-900">Confirmar Compra</h1>
          <Link href="/carrito" className="text-xs font-semibold text-stone-600 hover:text-teal-600 underline transition-colors">
            ← Volver al carrito
          </Link>
        </div>

        {items.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-stone-200 text-center shadow-sm">
            <p className="text-stone-600 mb-4 text-sm">No tienes productos en el carrito.</p>
            <Link href="/" className="inline-block px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all">
              Ir al inicio
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              
              {/* 1. Datos de contacto */}
              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-stone-900">1. Datos de contacto</h2>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Nombre y Apellido *
                  </label>
                  <input
                    type="text"
                    required
                    value={cliente.nombre}
                    onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    placeholder="Ej. Juan Pérez"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={cliente.telefono}
                      onChange={(e) => setCliente({ ...cliente, telefono: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                      placeholder="Ej. 2604123456"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                      Email (opcional)
                    </label>
                    <input
                      type="email"
                      value={cliente.email}
                      onChange={(e) => setCliente({ ...cliente, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                      placeholder="nombre@ejemplo.com"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Método de entrega */}
              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-stone-900">2. Método de entrega</h2>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMetodoEntrega("retiro")}
                    className={`py-3 px-4 rounded-2xl border text-xs font-bold transition-all ${
                      metodoEntrega === "retiro"
                        ? "border-teal-500 bg-teal-50 text-teal-800 shadow-sm"
                        : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                    }`}
                  >
                    Retiro en Local (Centro)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetodoEntrega("envio")}
                    className={`py-3 px-4 rounded-2xl border text-xs font-bold transition-all ${
                      metodoEntrega === "envio"
                        ? "border-teal-500 bg-teal-50 text-teal-800 shadow-sm"
                        : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
                    }`}
                  >
                    Envío a Domicilio
                  </button>
                </div>

                {metodoEntrega === "envio" && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                      Dirección de entrega en San Rafael *
                    </label>
                    <input
                      type="text"
                      required
                      value={cliente.direccion}
                      onChange={(e) => setCliente({ ...cliente, direccion: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                      placeholder="Calle, número, barrio o indicaciones"
                    />
                  </div>
                )}
              </div>

              {/* 3. Forma de pago */}
              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-stone-900">3. Forma de pago</h2>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3.5 border rounded-2xl cursor-pointer hover:bg-stone-50 transition-colors">
                    <input
                      type="radio"
                      name="pago"
                      value="transferencia"
                      checked={metodoPago === "transferencia"}
                      onChange={() => setMetodoPago("transferencia")}
                      className="accent-teal-600"
                    />
                    <div className="flex-1 text-xs">
                      <span className="font-bold text-stone-900">Transferencia o Débito (Banco Nación)</span>
                      <span className="ml-2 text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                        10% OFF
                      </span>
                    </div>
                  </label>

                  {metodoPago === "transferencia" && (
                    <div className="bg-teal-50/60 border border-teal-200 rounded-2xl p-4 text-xs text-stone-700 space-y-2 ml-4">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-teal-900 uppercase tracking-wider text-[10px]">
                          Datos de la cuenta bancaria
                        </span>
                        <button
                          type="button"
                          onClick={copiarAliasBanco}
                          className="px-2.5 py-1 bg-white border border-teal-300 rounded-lg text-teal-700 font-bold text-[10px] hover:bg-teal-100 transition-all shadow-sm"
                        >
                          {aliasBancoCopiado ? "✓ ¡Copiado!" : "Copiar Alias"}
                        </button>
                      </div>
                      <p><strong className="text-stone-900">Alias:</strong> <span className="font-mono font-bold text-teal-800">{DATOS_BANCARIOS.alias}</span></p>
                      <p><strong className="text-stone-900">CBU:</strong> <span className="font-mono text-[11px]">{DATOS_BANCARIOS.cbu}</span></p>
                      <p><strong className="text-stone-900">Titular:</strong> {DATOS_BANCARIOS.titular} ({DATOS_BANCARIOS.banco})</p>
                    </div>
                  )}

                  <label className="flex items-center gap-3 p-3.5 border rounded-2xl cursor-pointer hover:bg-stone-50 transition-colors">
                    <input
                      type="radio"
                      name="pago"
                      value="efectivo"
                      checked={metodoPago === "efectivo"}
                      onChange={() => setMetodoPago("efectivo")}
                      className="accent-teal-600"
                    />
                    <div className="flex-1 text-xs">
                      <span className="font-bold text-stone-900">Efectivo al retirar en local</span>
                      <span className="ml-2 text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                        10% OFF
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3.5 border rounded-2xl cursor-pointer hover:bg-stone-50 transition-colors">
                    <input
                      type="radio"
                      name="pago"
                      value="online"
                      checked={metodoPago === "online"}
                      onChange={() => setMetodoPago("online")}
                      className="accent-teal-600"
                    />
                    <div className="flex-1 text-xs">
                      <span className="font-bold text-stone-900">Mercado Pago / Cobro con QR</span>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Notas u observaciones adicionales
                  </label>
                  <textarea
                    rows={2}
                    value={cliente.notas}
                    onChange={(e) => setCliente({ ...cliente, notas: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    placeholder="Instrucciones para la entrega o aclaraciones"
                  />
                </div>
              </div>
            </div>

            {/* Columna Resumen */}
            <div>
              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm sticky top-6 space-y-4">
                <h3 className="font-bold text-stone-900 text-sm">Resumen del pedido</h3>
                <div className="text-xs space-y-2 border-b border-stone-100 pb-4">
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotal</span>
                    <span>${subtotal.toLocaleString("es-AR")}</span>
                  </div>
                  {descuento > 0 && (
                    <div className="flex justify-between text-teal-700 font-bold">
                      <span>Descuento (10%)</span>
                      <span>-${descuento.toLocaleString("es-AR")}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-stone-900 pt-2 border-t border-stone-100">
                    <span>Total</span>
                    <span className="text-teal-600">${totalCalculado.toLocaleString("es-AR")}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full py-3.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-bold rounded-2xl text-xs transition-all shadow-sm active:scale-95"
                >
                  {cargando ? "Registrando orden..." : "Confirmar Pedido →"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}