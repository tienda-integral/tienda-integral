import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tipo, nombre, telefono, mensaje, productoBuscado } = body;

    if (!nombre || !telefono || (!mensaje && !productoBuscado)) {
      return NextResponse.json(
        { error: "Nombre, teléfono y detalle son requeridos." },
        { status: 400 }
      );
    }

    // Guardamos en Supabase si tienes tabla 'consultas' o 'mensajes'
    // Si la tabla no existe aún, responde OK para no bloquear al cliente y permitir WhatsApp
    try {
      await supabase.from("consultas").insert({
        tipo: tipo || "encargo",
        cliente_nombre: nombre,
        cliente_telefono: telefono,
        detalle: productoBuscado || mensaje,
        created_at: new Date().toISOString(),
      });
    } catch (dbErr) {
      console.warn("Aviso: No se pudo registrar en tabla consultas (opcional):", dbErr);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Error al procesar consulta" }, { status: 500 });
  }
}