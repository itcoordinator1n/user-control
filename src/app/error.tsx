"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("🔥 Error capturado por el Error Boundary Global:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-6">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg border border-red-200 overflow-hidden">
        <div className="bg-red-600 px-6 py-4">
          <h2 className="text-xl font-bold text-white">¡Ups! Ocurrió un error inesperado</h2>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-gray-700">
            La aplicación encontró un problema técnico. A continuación se muestran los detalles técnicos para ayudar a depurarlo en el móvil:
          </p>

          <div className="bg-gray-100 p-4 rounded-md overflow-x-auto">
            <h3 className="font-semibold text-red-800 mb-2">{error.name || "Error"}: {error.message || "Sin mensaje"}</h3>
            <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono">
              {error.stack || "No stack trace available"}
            </pre>
            {error.digest && (
              <p className="text-xs text-gray-500 mt-2">Digest: {error.digest}</p>
            )}
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={() => reset()}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
            >
              Intentar Recuperar (Recargar componente)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
