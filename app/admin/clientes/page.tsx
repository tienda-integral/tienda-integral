import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";

export default async function ClientesPage() {
  const { data: clientes, error } = await supabase
    .from("clientes")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="flex">
      <Sidebar />

      <main className="flex-1 min-h-screen bg-gray-100 p-8">
        <h1 className="text-4xl font-bold text-blue-700 mb-6">
          Gestión de Clientes
        </h1>

        <Link
          href="/admin/clientes/nuevo"
          className="inline-block mb-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + Nuevo Cliente
        </Link>

        {error && (
          <p className="text-red-600 mb-4">
            Error: {error.message}
          </p>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-200">
              <tr>
                <th className="text-left p-3">Razón Social</th>
                <th className="text-left p-3">Nombre Fantasía</th>
                <th className="text-left p-3">CUIT</th>
                <th className="text-left p-3">Condición IVA</th>
                <th className="text-left p-3">Teléfono</th>
                <th className="text-left p-3">Email</th>
              </tr>
            </thead>

            <tbody>
              {clientes && clientes.length > 0 ? (
                clientes.map((cliente) => (
                  <tr key={cliente.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-medium">{cliente.razon_social}</td>
                    <td className="p-3 text-gray-600">{cliente.nombre_fantasia || "-"}</td>
                    <td className="p-3">{cliente.cuit}</td>
                    <td className="p-3 text-sm">{cliente.condicion_iva}</td>
                    <td className="p-3">{cliente.telefono || "-"}</td>
                    <td className="p-3">{cliente.email || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    No hay clientes registrados aún. Haz clic en "+ Nuevo Cliente" para comenzar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}