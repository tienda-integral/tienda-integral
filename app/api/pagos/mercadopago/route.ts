import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const accessToken = process.env.MP_ACCESS_TOKEN?.trim();

    if (!accessToken) {
      console.error("❌ MP_ACCESS_TOKEN no encontrado en .env.local");
      return NextResponse.json(
        { error: "Falta configurar MP_ACCESS_TOKEN en las variables de entorno." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { pedidoId, total, cliente } = body;

    const monto = Number(total);
    if (!monto || monto <= 0) {
      return NextResponse.json(
        { error: "El monto a cobrar debe ser mayor a 0." },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // Llamada directa oficial a la API de Mercado Pago
    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        items: [
          {
            id: `pedido-${pedidoId}`,
            title: `Pedido #${pedidoId} - Librería Maktub`,
            quantity: 1,
            unit_price: monto,
            currency_id: "ARS",
          },
        ],
        payer: {
          name: cliente?.nombre || "Cliente Maktub",
          email: cliente?.email?.includes("@") ? cliente.email : "comprador@maktub.com.ar",
        },
        back_urls: {
          success: `${baseUrl}/checkout?estado=aprobado&pedidoId=${pedidoId}`,
          failure: `${baseUrl}/checkout?estado=fallido&pedidoId=${pedidoId}`,
          pending: `${baseUrl}/checkout?estado=pendiente&pedidoId=${pedidoId}`,
        },
        auto_return: "approved",
        external_reference: String(pedidoId),
        statement_descriptor: "MAKTUB",
      }),
    });

    const mpData = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("❌ Error devuelto por la API de Mercado Pago:", mpData);
      return NextResponse.json(
        { error: mpData.message || "Error al generar preferencia en Mercado Pago" },
        { status: mpResponse.status }
      );
    }

    return NextResponse.json({
      preferenceId: mpData.id,
      initPoint: mpData.init_point,
    });
  } catch (error: any) {
    console.error("❌ Error interno en /api/pagos/mercadopago:", error);
    return NextResponse.json(
      { error: error?.message || "Error interno del servidor" },
      { status: 500 }
    );
  }
}