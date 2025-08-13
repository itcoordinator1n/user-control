// src/app/forbidden/page.tsx
import Link from "next/link";
import { Lock } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-xl p-8 text-center">
        <div className="flex justify-center mb-4">
          <Lock className="h-12 w-12 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Acceso Denegado
        </h1>
        <p className="text-gray-600 mb-6">
          No tienes permisos para acceder a esta página.  
          Si crees que se trata de un error, contacta con el administrador.
        </p>
        <Link
          href="/page/profile"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
