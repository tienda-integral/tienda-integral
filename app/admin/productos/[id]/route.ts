import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await props.params;
  const id = params.id;

  try {
    const { error } = await supabase
      .from("productos")
      .delete()
      .eq("id", Number(id));

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      mensaje: "Producto eliminado",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Error al eliminar el producto" },
      { status: 500 }
    );
  }
}