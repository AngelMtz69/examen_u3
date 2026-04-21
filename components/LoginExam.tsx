"use client";

import { useMemo, useState, useEffect } from "react";
import {
  autenticarUsuario,
  cerrarSesionUsuario,
  configurarPersistencia,
} from "@/firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/firebase/client";

type AuthUser = {
  email: string;
};

function esCorreoValido(correo: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

export default function LoginExam() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [recordarme, setRecordarme] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [usuario, setUsuario] = useState<AuthUser | null>(null);

  // sesion
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUsuario({
          email: user.email || "",
        });
      } else {
        setUsuario(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const tituloBoton = useMemo(() => {
    return cargando ? "Entrando..." : "Entrar";
  }, [cargando]);

  async function procesarAcceso(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    // Valida campos
    if (!correo || !contrasena) {
      setError("Todos los campos son obligatorios");
      return;
    }

    // Valida correo
    if (!esCorreoValido(correo)) {
      setError("El correo no es válido");
      return;
    }

    try {
      setCargando(true);

      //Persistenci (Recordar)
      await configurarPersistencia(recordarme);

      // Login
      const credenciales = await autenticarUsuario(correo, contrasena);

      setUsuario({
        email: credenciales.user.email || "",
      });
    } catch (err) {
      setError("Correo o contraseña incorrectos");
    } finally {
      setCargando(false);
    }
  }

  async function salir() {
    await cerrarSesionUsuario();
    setUsuario(null);
    setCorreo("");
    setContrasena("");
    setRecordarme(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="w-full max-w-md bg-white p-6 rounded-xl shadow">
        <div className="mb-4 text-center">
          <h1 className="text-xl font-bold">Acceso escolar</h1>
          <p className="text-gray-500 text-sm">
            Completa los datos para iniciar sesión.
          </p>
        </div>

        {!usuario ? (
          <form onSubmit={procesarAcceso} className="space-y-4">
            <div>
              <label className="block text-sm">Correo electrónico</label>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="alumno@correo.com"
              />
            </div>

            <div>
              <label className="block text-sm">Contraseña</label>
              <input
                type="password"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="******"
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={recordarme}
                onChange={(e) => setRecordarme(e.target.checked)}
              />
              Recordarme
            </label>

            {error && (
              <div className="text-red-500 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-black text-white py-2 rounded"
            >
              {tituloBoton}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <div>
              <p className="text-green-600">Inicio de sesión correcto</p>
              <h2 className="font-bold">Bienvenido, {usuario.email}</h2>
            </div>

            <button
              type="button"
              onClick={salir}
              className="w-full bg-black text-white py-2 rounded"
            >
              Cerrar sesión
            </button>
          </div>
        )}
      </section>
    </main>
  );
}