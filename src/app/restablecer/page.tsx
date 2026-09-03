"use client";

/**
 * Página de restablecimiento de contraseña por enlace de un solo uso.
 *
 * Es el destino de `${APP_URL}/restablecer?u=<usuario>&t=<token>`, el enlace que
 * llega por WhatsApp cuando un administrador restablece un acceso. Hasta ahora el
 * backend generaba ese enlace y nadie lo atendía: daba 404.
 *
 * Deliberadamente NO viaja ninguna contraseña, ni en el chat ni en la URL. Lo único
 * que va en el enlace es un token opaco de 30 minutos; la persona elige aquí su clave
 * y el token queda consumido. Así no hay que copiar nada a mano ni queda una
 * contraseña escrita para siempre en el historial del chat.
 *
 * Vive fuera de /page/ a propósito: el matcher del middleware solo cubre `/`,
 * `/login` y `/page/*`, así que esta ruta es pública, que es justo lo que necesita
 * alguien que no puede entrar.
 */

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, KeyRound, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const LARGO_MINIMO = 8;

function Formulario() {
  const params = useSearchParams();
  const router = useRouter();

  const usuario = params.get("u") ?? "";
  const token = params.get("t") ?? "";

  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [verClave, setVerClave] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);
  /** Enlace vencido o ya usado: no se puede reintentar desde aquí. */
  const [agotado, setAgotado] = useState<string | null>(null);

  // El backend recorta la contraseña antes de guardarla (igual que el login), así que
  // el largo se mide sobre lo recortado: si no, "  1234  " pasaría por 8 caracteres.
  const limpia = password.trim();
  const suficiente = limpia.length >= LARGO_MINIMO;
  const coinciden = limpia.length > 0 && limpia === confirmacion.trim();
  const puedeEnviar = !!token && suficiente && coinciden && !enviando;

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeEnviar) return;
    setEnviando(true);
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-with-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: limpia }),
      });
      const data = await res.json();
      if (!res.ok) {
        // 410 = el enlace ya no sirve (usado o vencido). Es un callejón sin salida:
        // no tiene sentido dejar el formulario puesto, hay que pedir otro enlace.
        if (res.status === 410) {
          setAgotado(data?.error || "Este enlace ya no es válido.");
          return;
        }
        throw new Error(data?.error || "No se pudo restablecer la contraseña.");
      }
      setListo(true);
    } catch (err) {
      // Un fallo de red aquí es indistinguible de un backend caído; se dice qué hacer
      // en vez de dejar un mensaje técnico.
      setError(err instanceof Error && err.message !== "Failed to fetch"
        ? err.message
        : "No se pudo conectar con el sistema. Revisá tu conexión y volvé a intentar.");
    } finally {
      setEnviando(false);
    }
  };

  if (!token) {
    return (
      <Aviso
        icono={<AlertCircle className="h-10 w-10 text-red-500" />}
        titulo="Enlace incompleto"
        texto="Este enlace no trae la información necesaria. Pedí uno nuevo a Sistemas."
      />
    );
  }

  if (agotado) {
    return (
      <Aviso
        icono={<AlertCircle className="h-10 w-10 text-amber-500" />}
        titulo="Este enlace ya no sirve"
        texto={agotado}
      >
        <div className="mt-4 text-left text-sm text-gray-600 bg-gray-50 border rounded-lg p-3 space-y-2">
          <p className="font-medium text-gray-800">Qué hacer:</p>
          <p>
            Pedile a Recursos Humanos o a Sistemas que te reenvíe el enlace. Cada uno
            sirve una sola vez y dura 30 minutos.
          </p>
          <p className="text-xs text-gray-500">
            Si ya elegiste tu contraseña antes con este mismo enlace, no pidas otro:
            probá entrar directamente.
          </p>
        </div>
        <Button variant="outline" className="w-full mt-4" onClick={() => router.push("/page/login")}>
          Ir a iniciar sesión
        </Button>
      </Aviso>
    );
  }

  if (listo) {
    return (
      <Aviso
        icono={<CheckCircle2 className="h-10 w-10 text-green-600" />}
        titulo="Contraseña actualizada"
        texto={`Ya podés entrar al sistema${usuario ? ` con el usuario ${usuario}` : ""}.`}
      >
        <Button className="w-full mt-4" onClick={() => router.push("/page/login")}>
          Ir a iniciar sesión
        </Button>
      </Aviso>
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-5">
      <div className="text-center space-y-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
          <KeyRound className="h-6 w-6 text-green-700" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Elegí tu nueva contraseña</h1>
        {usuario && (
          <p className="text-sm text-gray-500">
            Usuario <span className="font-mono font-medium text-gray-700">{usuario}</span>
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Nueva contraseña</Label>
        <div className="relative">
          <Input
            id="password"
            type={verClave ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            autoFocus
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setVerClave((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label={verClave ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {verClave ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {/* El unico requisito real es el largo: el backend recorta y pide 8. Se
            muestra en vivo para que nadie descubra el problema recien al enviar. */}
        <ul className="text-xs space-y-0.5 mt-1">
          <li className={suficiente ? "text-green-700" : "text-gray-500"}>
            {suficiente ? "✓" : "○"} Al menos {LARGO_MINIMO} caracteres
            {password && !suficiente && ` (llevás ${limpia.length})`}
          </li>
          <li className={coinciden ? "text-green-700" : "text-gray-500"}>
            {coinciden ? "✓" : "○"} Las dos coinciden
          </li>
        </ul>
        <p className="text-xs text-gray-400">
          No hace falta que tenga mayúsculas, números ni símbolos. Los espacios al
          principio y al final se ignoran.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmacion">Repetila</Label>
        <Input
          id="confirmacion"
          type={verClave ? "text" : "password"}
          value={confirmacion}
          onChange={(e) => setConfirmacion(e.target.value)}
          autoComplete="new-password"
        />
        {confirmacion && !coinciden && (
          <p className="text-xs text-red-600">Las dos contraseñas no coinciden.</p>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={!puedeEnviar}>
        {enviando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
        Guardar contraseña
      </Button>

      <p className="text-xs text-center text-gray-400">
        El enlace vence a los 30 minutos y sirve una sola vez.
      </p>
    </form>
  );
}

function Aviso({
  icono, titulo, texto, children,
}: {
  icono: React.ReactNode; titulo: string; texto: string; children?: React.ReactNode;
}) {
  return (
    <div className="text-center space-y-3">
      <div className="mx-auto w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
        {icono}
      </div>
      <h1 className="text-xl font-bold text-gray-900">{titulo}</h1>
      <p className="text-sm text-gray-600">{texto}</p>
      {children}
    </div>
  );
}

export default function RestablecerPage() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border p-8">
        <div className="text-center mb-6">
          <p className="text-lg font-bold tracking-wide text-green-800">INFARMA</p>
          <p className="text-xs text-gray-400">Sistema de Gestión Interna</p>
        </div>
        {/* useSearchParams necesita un límite de Suspense para poder prerenderizar. */}
        <Suspense fallback={<p className="text-sm text-center text-gray-400">Cargando…</p>}>
          <Formulario />
        </Suspense>
      </div>
    </main>
  );
}
