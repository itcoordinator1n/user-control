/**
 * conciliacion-export.ts — Export client-side (Excel / PDF / CSV) para las
 * tablas del módulo. El backend hoy solo entrega CSV (?format=csv); el xlsx/pdf
 * "acta" se genera aquí con exceljs + jspdf (ambos ya instalados).
 */

import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ExportColumn<T> {
  key: keyof T | string;
  header: string;
  /** Formateador opcional del valor de la celda. */
  format?: (row: T) => string | number;
}

function cellValue<T>(row: T, col: ExportColumn<T>): string | number {
  if (col.format) return col.format(row);
  const v = (row as Record<string, unknown>)[col.key as string];
  if (v === null || v === undefined) return '';
  return v as string | number;
}

/** Exporta filas a un .xlsx con una tabla estilizada. */
export async function exportarExcel<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  filename: string,
  sheetName = 'Datos',
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName);

  ws.addTable({
    name: 'Tabla',
    ref: 'A1',
    headerRow: true,
    style: { theme: 'TableStyleMedium2', showRowStripes: true },
    columns: columns.map((c) => ({ name: c.header, filterButton: true })),
    rows: rows.map((r) => columns.map((c) => cellValue(r, c))),
  });

  // Ancho automático aproximado
  ws.columns.forEach((col, i) => {
    const header = columns[i]?.header ?? '';
    let max = header.length;
    rows.forEach((r) => {
      const val = String(cellValue(r, columns[i]));
      if (val.length > max) max = val.length;
    });
    col.width = Math.min(Math.max(max + 2, 10), 60);
  });

  const buffer = await wb.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`,
  );
}

/** Exporta filas a un .pdf apto para "acta" (título + metadatos + tabla). */
export function exportarPdfActa<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  meta: { titulo: string; subtitulo?: string; extra?: Array<[string, string]> },
  filename: string,
): void {
  const doc = new jsPDF({ orientation: columns.length > 6 ? 'landscape' : 'portrait' });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(meta.titulo, pageWidth / 2, 18, { align: 'center' });

  let y = 26;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (meta.subtitulo) {
    doc.text(meta.subtitulo, pageWidth / 2, y, { align: 'center' });
    y += 6;
  }
  (meta.extra ?? []).forEach(([label, value]) => {
    doc.text(`${label}: ${value}`, 14, y);
    y += 5;
  });

  autoTable(doc, {
    startY: y + 2,
    head: [columns.map((c) => c.header)],
    body: rows.map((r) => columns.map((c) => String(cellValue(r, c)))),
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [30, 64, 175] },
    margin: { left: 10, right: 10 },
  });

  doc.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
}

/** Descarga un CSV producido por el backend (fetch autenticado → saveAs). */
export async function descargarCsv(
  fetchBlob: () => Promise<Blob>,
  filename: string,
): Promise<void> {
  const blob = await fetchBlob();
  saveAs(blob, filename.endsWith('.csv') ? filename : `${filename}.csv`);
}
