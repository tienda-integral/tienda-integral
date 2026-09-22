import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { data, error } = await supabase.from("proveedores").insert([
      {
        razon_social: body.razon_social,
        nombre_fantasia: body.nombre_fantasia || null,
        cuit: body.cuit,
        condicion_iva: body.condicion_iva || "RESPONSABLE_INSCRIPTO",
        rubro: body.rubro || null,
        direccion: body.direccion || null,
        telefono: body.telefono || null,
        email: body.email || null,
        contacto_nombre: body.contacto_nombre || null,
      },
    ]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { mensaje: "Proveedor guardado con éxito", data },
      { status: 201 }
    );
  } catch (err: unknown) {
    const mensaje = err instanceof Error ? err.message : "Error inesperado";
    return NextResponse.json({ error: mensaje }, { status: 500 });
  }
}