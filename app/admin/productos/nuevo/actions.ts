"use server";

export async function guardarProducto(formData: FormData) {
  console.log("PRODUCTO RECIBIDO");

  console.log({
    nombre: formData.get("nombre"),
  });
}