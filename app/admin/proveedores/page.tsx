import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { supabase } from "@/lib/supabase";

export default async function ProveedoresPage() {
  const { data: proveedores, error } = await supabase
    .from("proveedores")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="flex">
      <Sidebar />

      <main className="flex-1 min-h-screen bg-gray-100 p-8">
        <h1 className="text-4xl font-bold text-blue-700 mb-6">
          Gestión de Proveedores
        </h1>

        <Link
          href="/admin/proveedores/nuevo"
          className="inline-block mb-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + Nuevo Proveedor
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
                <th className="text-left p-3">Rubro</th>
                <th className="text-left p-3">CUIT</th>
                <th className="text-left p-3">Contacto</th>
                <th className="text-left p-3">Teléfono</th>
                <th className="text-left p-3">Email</th>
              </tr>
            </thead>

            <tbody>
              {proveedores && proveedores.length > 0 ? (
                proveedores.map((proveedor) => (
                  <tr key={proveedor.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-medium">{proveedor.razon_social}</td>
                    <td className="p-3 text-gray-600">{proveedor.rubro || "-"}</td>
                    <td className="p-3">{proveedor.cuit}</td>
                    <td className="p-3">{proveedor.contacto_nombre || "-"}</td>
                    <td className="p-3">{proveedor.telefono || "-"}</td>
                    <td className="p-3">{proveedor.email || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-gray-500">
                    No hay proveedores registrados aún. Haz clic en "+ Nuevo Proveedor" para comenzar.
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