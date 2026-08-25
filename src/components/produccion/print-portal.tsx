"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Monta el reporte imprimible como hijo directo de <body>.
 *
 * Es lo que permite que el CSS de impresion oculte a sus hermanos con
 * `display:none` en vez de `visibility:hidden`. Con visibility el resto de
 * la app seguia ocupando alto en el documento y se imprimian hojas en
 * blanco al final; y al sacar el reporte del flujo con position:absolute,
 * su `width:100%` se medi­a contra la ventana y no contra el area
 * imprimible, cortando la tabla por la derecha.
 *
 * Fuera de impresion el contenedor esta oculto, asi que no afecta a la UI.
 */
export function PrintPortal({ children }: { children: React.ReactNode }) {
  const [contenedor, setContenedor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const el = document.createElement("div");
    el.className = "print-root";
    el.style.display = "none";
    document.body.appendChild(el);
    setContenedor(el);
    return () => { document.body.removeChild(el); };
  }, []);

  if (!contenedor) return null;
  return createPortal(children, contenedor);
}
