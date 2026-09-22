import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("productos")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error al obtener productos";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const nuevoProducto = {
      codigo_interno: body.codigo_interno || null,
      codigo_barras: body.codigo_barras || null,
      nombre: body.nombre,
      marca: body.marca || null,
      proveedor: body.proveedor || null,
      categoria: body.categoria,
      rubro: body.categoria, // Duplicado para compatibilidad con la tienda
      subcategoria: body.subcategoria || null,
      precio_costo: Number(body.precio_costo) || 0,
      precio: Number(body.precio) || 0,
      existencia: Number(body.existencia) || 0,
      stock_minimo: Number(body.stock_minimo) || 0,
      descripcion: body.descripcion || null,
      imagen_url: body.imagen_url || null,
      en_oferta: Boolean(body.en_oferta),
      texto_oferta: body.en_oferta ? (body.texto_oferta || "OFERTA") : null,
      color_oferta: body.en_oferta ? (body.color_oferta || "rojo") : "rojo",
    };

    const { data, error } = await supabase
      .from("productos")
      .insert([nuevoProducto])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      mensaje: "Producto guardado y publicado correctamente",
      data,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error al procesar la solicitud";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}