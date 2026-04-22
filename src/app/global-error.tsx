"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-6">
          <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg border border-red-200 overflow-hidden">
            <div className="bg-red-800 px-6 py-4">
              <h2 className="text-xl font-bold text-white">Fallo Crítico Global (Root Layout)</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-gray-700">
                La aplicación sufrió un colapso en el layout principal. Detalles:
              </p>

              <div className="bg-gray-100 p-4 rounded-md overflow-x-auto">
                <h3 className="font-semibold text-red-800 mb-2">{error.name || "Error"}: {error.message || "Sin mensaje"}</h3>
                <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono">
                  {error.stack || "No stack trace available"}
                </pre>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => reset()}
                  className="px-6 py-2 bg-red-800 hover:bg-red-900 text-white font-medium rounded-lg transition-colors"
                >
                  Recargar Aplicación
                </button>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
