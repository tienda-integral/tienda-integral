"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setErrorMsg("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        setErrorMsg("Credenciales incorrectas: " + (error?.message || "Usuario no encontrado"));
        setCargando(false);
        return;
      }

      // Consulta del perfil por ID de usuario autenticado
      const { data: perfil, error: errPerfil } = await supabase
        .from("perfiles")
        .select("rol")
        .eq("id", data.user.id)
        .maybeSingle();

      if (errPerfil || !perfil) {
        setErrorMsg("Error al leer permisos: " + (errPerfil?.message || "Perfil no asignado"));
        setCargando(false);
        return;
      }

      if (perfil.rol === "cliente") {
        await supabase.auth.signOut();
        setErrorMsg("Tu cuenta no tiene permisos para acceder al panel de administración.");
        setCargando(false);
        return;
      }

      // Si es admin u operador, ingresa al panel
      router.push("/admin/productos");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error inesperado";
      setErrorMsg("Ocurrió un error al iniciar sesión: " + msg);
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border border-blue-100 shadow-inner">
            🔐
          </div>
          <h1 className="text-2xl font-black text-slate-900">Acceso al Panel</h1>
          <p className="text-slate-500 text-sm mt-1">Ingresá con tus credenciales de equipo</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ejemplo.com"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow hover:shadow-md disabled:opacity-50 text-sm mt-2"
          >
            {cargando ? "Verificando acceso..." : "Ingresar"}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <Link href="/tienda" className="text-xs font-semibold text-slate-500 hover:text-slate-800">
            ← Volver a la Tienda Pública
          </Link>
        </div>
      </div>
    </main>
  );
}