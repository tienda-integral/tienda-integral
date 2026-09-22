import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// GET: El panel admin lee todos los pedidos con sus items
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("pedidos")
      .select("*, pedido_items(*)")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ pedidos: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error al leer pedidos" }, { status: 500 });
  }
}

// POST: El checkout guarda una orden nueva
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cliente, pedido, items } = body;

    if (!cliente?.nombre || !cliente?.telefono) {
      return NextResponse.json(
        { error: "Nombre y teléfono son obligatorios." },
        { status: 400 }
      );
    }

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "El pedido no contiene artículos." },
        { status: 400 }
      );
    }

    const { data: pedidoData, error: pedidoError } = await supabase
      .from("pedidos")
      .insert({
        cliente_nombre: cliente.nombre,
        cliente_telefono: cliente.telefono,
        cliente_email: cliente.email || null,
        metodo_entrega: pedido.metodoEntrega || "retiro",
        direccion_envio: pedido.direccionEnvio || null,
        metodo_pago: pedido.metodoPago || "transferencia",
        subtotal: Number(pedido.subtotal) || 0,
        descuento: Number(pedido.descuento) || 0,
        total: Number(pedido.total) || 0,
        estado: "pendiente",
        notas: pedido.notas || null,
      })
      .select("id")
      .single();

    if (pedidoError) {
      return NextResponse.json({ error: pedidoError.message }, { status: 500 });
    }

    const itemsFormateados = items.map((item: any) => ({
      pedido_id: pedidoData.id,
      tipo: item.tipo || "producto",
      nombre: item.nombre || "Artículo sin nombre",
      cantidad: Number(item.cantidad) || 1,
      precio_unitario: Number(item.precioUnitario) || 0,
      precio_total: Number(item.precioTotal) || 0,
      detalles_tecnicos: item.detallesTecnicos || null,
    }));

    const { error: itemsError } = await supabase
      .from("pedido_items")
      .insert(itemsFormateados);

    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: pedidoData.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error interno." }, { status: 500 });
  }
}

// PATCH: El panel admin actualiza el estado de la orden
export async function PATCH(request: Request) {
  try {
    const { id, estado } = await request.json();

    if (!id || !estado) {
      return NextResponse.json({ error: "ID y estado requeridos" }, { status: 400 });
    }

    const { error } = await supabase
      .from("pedidos")
      .update({ estado })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error al actualizar" }, { status: 500 });
  }
}