"use client";

import { useRouter } from "next/navigation";

type Props = {
  id: number;
};

export default function BotonEliminar({ id }: Props) {
  const router = useRouter();

  async function eliminarProducto() {
    const confirmar = window.confirm(
      "¿Desea eliminar este producto?"
    );

    if (!confirmar) return;

    const response = await fetch(
      `/api/productos/${id}`,
      {
        method: "DELETE",
      }
    );

    if (response.ok) {
      alert("Producto eliminado");
      router.refresh();
    } else {
      alert("Error al eliminar");
    }
  }

  return (
    <button
      onClick={eliminarProducto}
      className="bg-red-600 text-white px-3 py-1 rounded"
    >
      Eliminar
    </button>
  );
}