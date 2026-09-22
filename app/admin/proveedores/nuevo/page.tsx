"use client";

import { useState } from "react";
import Link from "next/link";

export default function NuevoProveedorPage() {
  const [cargando, setCargando] = useState(false);

  async function guardarProveedor(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCargando(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/proveedores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          razon_social: formData.get("razon_social"),
          nombre_fantasia: formData.get("nombre_fantasia"),
          cuit: formData.get("cuit"),
          condicion_iva: formData.get("condicion_iva"),
          rubro: formData.get("rubro"),
          direccion: formData.get("direccion"),
          telefono: formData.get("telefono"),
          email: formData.get("email"),
          contacto_nombre: formData.get("contacto_nombre"),
        }),
      });

      const data = await response.json().catch(() => null);

      setCargando(false);

      if (response.ok) {
        alert("Proveedor guardado correctamente");
        form.reset();
      } else {
        const errorMsg = data?.error || `Error del servidor (Estado: ${response.status})`;
        alert("Atención: " + errorMsg);
      }
    } catch (err: unknown) {
      setCargando(false);
      const msg = err instanceof Error ? err.message : "Error de red";
      alert("Error de conexión: " + msg);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-3xl mb-6 flex justify-between items-center">
        <h1 className="text-4xl font-bold text-blue-700">Nuevo Proveedor</h1>
        <Link
          href="/admin/proveedores"
          className="text-gray-600 hover:text-gray-900 underline text-sm"
        >
          Volver a la lista
        </Link>
      </div>

      <form
        onSubmit={guardarProveedor}
        className="bg-white rounded-lg shadow p-6 max-w-3xl"
      >
        <div className="mb-4">
          <label className="block mb-2 font-semibold">Razón Social *</label>
          <input
            name="razon_social"
            type="text"
            required
            placeholder="Ej: Distribuidora Papelera S.A."
            className="w-full border rounded p-2"
          />
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-semibold">Nombre de Fantasía</label>
          <input
            name="nombre_fantasia"
            type="text"
            placeholder="Ej: Papelera Central"
            className="w-full border rounded p-2"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-2 font-semibold">CUIT *</label>
            <input
              name="cuit"
              type="text"
              required
              placeholder="30-87654321-4"
              className="w-full border rounded p-2"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">Condición Frente al IVA *</label>
            <select
              name="condicion_iva"
              defaultValue="RESPONSABLE_INSCRIPTO"
              className="w-full border rounded p-2 bg-white"
            >
              <option value="RESPONSABLE_INSCRIPTO">Responsable Inscripto</option>
              <option value="MONOTRIBUTO">Monotributo</option>
              <option value="EXENTO">Exento</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-2 font-semibold">Rubro / Especialidad</label>
            <input
              name="rubro"
              type="text"
              placeholder="Ej: Papeles, Tintas, Vinilos"
              className="w-full border rounded p-2"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">Persona de Contacto</label>
            <input
              name="contacto_nombre"
              type="text"
              placeholder="Ej: Juan Pérez (Ventas)"
              className="w-full border rounded p-2"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block mb-2 font-semibold">Dirección</label>
          <input
            name="direccion"
            type="text"
            placeholder="Av. Industrial 456, Parque Industrial"
            className="w-full border rounded p-2"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block mb-2 font-semibold">Teléfono / WhatsApp</label>
            <input
              name="telefono"
              type="text"
              placeholder="+54 11 9876-5432"
              className="w-full border rounded p-2"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">Email Comercial</label>
            <input
              name="email"
              type="email"
              placeholder="ventas@papeleracentral.com"
              className="w-full border rounded p-2"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={cargando}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50"
        >
          {cargando ? "Guardando..." : "Guardar Proveedor"}
        </button>
      </form>
    </main>
  );
}