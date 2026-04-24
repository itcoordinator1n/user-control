import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { ProduccionControl } from "./services/produccion.service";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Categories matching the image
export const FORMATO_ACTIVIDADES = [
  { tipo: "header", label: "Fabricar" },
  { tipo: "actividad", label: "Limpiar Utensilios" },
  { tipo: "actividad", label: "Limpiar Tanques" },
  { tipo: "actividad", label: "Limpiar Area" },
  { tipo: "actividad", label: "Fabricar" },
  { tipo: "header", label: "Filtrar" },
  { tipo: "actividad", label: "Limpiar Filtros" },
  { tipo: "actividad", label: "Filtrar" },
  { tipo: "header", label: "Envasar/Taponar" },
  { tipo: "actividad", label: "Limpiar Maquinas" },
  { tipo: "blank" },
  { tipo: "actividad", label: "Limpiar Area" },
  { tipo: "blank" },
  { tipo: "blank" },
  { tipo: "actividad", label: "Lavar frascos" },
  { tipo: "actividad", label: "Lavar Frascos" },
  { tipo: "actividad", label: "Envasar/Taponar" },
  { tipo: "actividad", label: "Envasar" },
  { tipo: "blank" },
  { tipo: "actividad", label: "Tapar" },
  { tipo: "actividad", label: "Revisar y Apartar" },
  { tipo: "blank" },
  { tipo: "blank" },
  { tipo: "header", label: "Etiquetar" },
  { tipo: "actividad", label: "Limpiar area" },
  { tipo: "blank" },
  { tipo: "blank" },
  { tipo: "blank" },
  { tipo: "actividad", label: "Colocar frascos" },
  { tipo: "actividad", label: "Etiquetar" },
  { tipo: "blank" },
  { tipo: "actividad", label: "Acomodar Etiqueta" },
  { tipo: "blank" },
  { tipo: "blank" },
  { tipo: "blank" },
  { tipo: "actividad", label: "Limpiar frasco" },
  { tipo: "blank" },
  { tipo: "blank" },
  { tipo: "header", label: "Empacar" },
  { tipo: "actividad", label: "Armar caja" },
  { tipo: "actividad", label: "Empacar" },
  { tipo: "actividad", label: "Sellar Corrugado y Estibar" },
  { tipo: "header", label: "Codificar" },
  { tipo: "actividad", label: "Codificar" },
  { tipo: "actividad", label: "Codificar frasco" }
];

export async function exportControlToExcel(control: ProduccionControl) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Control de Tiempos");

  // Calcular el número máximo de intervalos (mínimo 3)
  const maxIntervals = Math.max(3, ...control.actividades.map(a => a.intervalos.length));
  const totalColIndex = 4 + (maxIntervals * 2); // Columna donde va el TOTAL

  // --- CONFIGURACIÓN DE COLUMNAS ---
  sheet.getColumn(1).width = 12; // A: Fecha
  sheet.getColumn(2).width = 30; // B: Actividad
  sheet.getColumn(3).width = 30; // C: Operario
  
  for (let i = 0; i < maxIntervals; i++) {
    sheet.getColumn(4 + (i * 2)).width = 12; // DE
    sheet.getColumn(5 + (i * 2)).width = 12; // HASTA
  }
  sheet.getColumn(totalColIndex).width = 18; // TOTAL HORAS

  // 1. Cabecera superior dinámica
  sheet.mergeCells(1, 1, 3, 2); // Espacio para Logo
  sheet.getCell(1, 1).value = "Infarma";
  sheet.getCell(1, 1).alignment = { vertical: "middle", horizontal: "center" };
  sheet.getCell(1, 1).font = { bold: true, size: 16, color: { argb: "FF004080" } };
  
  sheet.mergeCells(1, 3, 3, totalColIndex - 1);
  sheet.getCell(1, 3).value = "HOJA CONTROL DE TIEMPOS DE PRODUCCION: ALIMENTOS";
  sheet.getCell(1, 3).alignment = { vertical: "middle", horizontal: "center" };
  sheet.getCell(1, 3).font = { bold: true, size: 12 };

  sheet.mergeCells(1, totalColIndex, 2, totalColIndex);
  sheet.getCell(1, totalColIndex).value = "CÓDIGO: RO-OP-068";
  sheet.getCell(1, totalColIndex).alignment = { vertical: "middle", horizontal: "center" };
  sheet.getCell(1, totalColIndex).font = { size: 8 };

  sheet.getCell(3, totalColIndex).value = "Versión: 02";
  sheet.getCell(3, totalColIndex).font = { size: 8 };
  sheet.getCell(3, totalColIndex).alignment = { vertical: "middle", horizontal: "center" };

  sheet.mergeCells(4, 1, 4, 3);
  sheet.getCell(4, 1).value = "Elaborado por : Josué Molina\nRevisado y modificado por: Patricia Palma";
  sheet.getCell(4, 1).alignment = { wrapText: true, vertical: "top" };
  sheet.getCell(4, 1).font = { size: 7 };

  sheet.mergeCells(4, 4, 4, totalColIndex - 2);
  sheet.getCell(4, 4).value = "Fecha de primera versión: 25-08-2010\nFecha de última versión: 20-05-2013";
  sheet.getCell(4, 4).alignment = { wrapText: true, vertical: "top" };
  sheet.getCell(4, 4).font = { size: 7 };

  sheet.getCell(4, totalColIndex - 1).value = "Página 1 de 1";
  sheet.getCell(4, totalColIndex - 1).font = { size: 8 };
  sheet.getCell(4, totalColIndex - 1).alignment = { vertical: "middle", horizontal: "center" };

  sheet.getCell(4, totalColIndex).value = "Revisado por:\nJefe de Manufactura";
  sheet.getCell(4, totalColIndex).alignment = { wrapText: true, vertical: "top" };
  sheet.getCell(4, totalColIndex).font = { size: 7 };

  // Bordes para la cabecera (Filas 1 a 4)
  for (let r = 1; r <= 4; r++) {
    for (let c = 1; c <= totalColIndex; c++) {
      const cell = sheet.getCell(r, c);
      cell.border = {
        top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" }
      };
    }
  }

  // 2. Variables de Información
  sheet.mergeCells(6, 1, 6, 3);
  sheet.getCell(6, 1).value = `Proceso : ${control.proceso}`;
  sheet.getCell(6, 1).font = { bold: true, size: 12 };

  sheet.mergeCells(6, 4, 6, totalColIndex);
  sheet.getCell(6, 4).value = `Producto: ${control.producto_nombre}`;
  sheet.getCell(6, 4).font = { bold: true, size: 12 };

  sheet.mergeCells(7, 1, 7, 3);
  sheet.getCell(7, 1).value = `Nº de Lote: ${control.n_lote}`;
  sheet.getCell(7, 1).font = { bold: true, size: 12 };

  sheet.mergeCells(7, 4, 7, totalColIndex);
  sheet.getCell(7, 4).value = `O/P: ${control.op}`;
  sheet.getCell(7, 4).font = { bold: true, size: 12 };

  // 3. Encabezados de Tabla
  const headerRow9 = sheet.getRow(9);
  const headerRow10 = sheet.getRow(10);
  
  headerRow9.getCell(1).value = "Fecha";
  headerRow9.getCell(2).value = "Actividad";
  headerRow9.getCell(3).value = "Operario";
  headerRow9.getCell(totalColIndex).value = "TOTAL";

  headerRow10.getCell(3).value = "Nombre y Apellido";
  headerRow10.getCell(totalColIndex).value = "HORAS";

  for (let i = 0; i < maxIntervals; i++) {
    const colStart = 4 + (i * 2);
    sheet.mergeCells(9, colStart, 9, colStart + 1);
    headerRow9.getCell(colStart).value = `Intervalo ${i + 1}`;
    headerRow10.getCell(colStart).value = "DE";
    headerRow10.getCell(colStart + 1).value = "HASTA";
  }

  sheet.mergeCells(9, 1, 10, 1); // Fecha
  sheet.mergeCells(9, 2, 10, 2); // Actividad
  sheet.mergeCells(9, 3, 9, 3); // Operario
  sheet.mergeCells(9, totalColIndex, 10, totalColIndex); // TOTAL HORAS

  // Estilos de encabezado
  for(let i=1; i<=totalColIndex; i++) {
    [9, 10].forEach(r => {
      const cell = sheet.getCell(r, i);
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.font = { bold: true, size: r === 10 ? 10 : 11 };
      cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    });
  }

  // 4. Llenar Tabla
  let currentRow = 11;
  const controlDate = format(new Date(control.fecha), "dd/MM/yyyy");
  let globalTotalMs = 0;

  const parseUTC = (isoStr: string) => {
    if (!isoStr) return new Date();
    // Normalizar formato y dejar que el navegador maneje la zona horaria
    return new Date(isoStr.replace(" ", "T"));
  };

  const renderedIds = new Set<string>();

  FORMATO_ACTIVIDADES.forEach((item) => {
    if (item.tipo === "header") {
      const row = sheet.getRow(currentRow);
      for(let c=1; c<=totalColIndex; c++) {
        row.getCell(c).border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
      }
      row.getCell(2).value = item.label;
      row.getCell(2).font = { bold: true };
      currentRow++;
    } else if (item.tipo === "actividad") {
      const matchingActs = control.actividades.filter(a => a.actividad_nombre === item.label);
      
      if (matchingActs.length > 0) {
        matchingActs.forEach(matchedAct => {
          renderedIds.add(matchedAct.id);
          const row = sheet.getRow(currentRow);
          for(let c=1; c<=totalColIndex; c++) {
            row.getCell(c).border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
          }
          row.getCell(1).value = controlDate;
          row.getCell(2).value = item.label;
          row.getCell(3).value = matchedAct.operario_nombre;
          
          let rowTotalMs = 0;
          matchedAct.intervalos.forEach((interval, index) => {
            if (interval.hora_inicio && index < maxIntervals) {
              const startDate = parseUTC(interval.hora_inicio);
              row.getCell(4 + (index * 2)).value = format(startDate, "HH:mm:ss");
              row.getCell(4 + (index * 2)).alignment = { horizontal: "center" };
              
              if (interval.hora_fin) {
                const endDate = parseUTC(interval.hora_fin);
                row.getCell(5 + (index * 2)).value = format(endDate, "HH:mm:ss");
                row.getCell(5 + (index * 2)).alignment = { horizontal: "center" };
                rowTotalMs += Math.max(0, endDate.getTime() - startDate.getTime());
              }
            }
          });

          if (rowTotalMs > 0) {
            globalTotalMs += rowTotalMs;
            const h = Math.floor(rowTotalMs / 3600000);
            const m = Math.floor((rowTotalMs % 3600000) / 60000);
            const s = Math.floor((rowTotalMs % 60000) / 1000);
            row.getCell(totalColIndex).value = `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            row.getCell(totalColIndex).alignment = { horizontal: "center" };
          }
          currentRow++;
        });
      } else {
        const row = sheet.getRow(currentRow);
        for(let c=1; c<=totalColIndex; c++) {
          row.getCell(c).border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
        }
        row.getCell(2).value = item.label;
        currentRow++;
      }
    } else if (item.tipo === "blank") {
      const row = sheet.getRow(currentRow);
      for(let c=1; c<=totalColIndex; c++) {
        row.getCell(c).border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
      }
      currentRow++;
    }
  });

  // 5. Otras Actividades (las que no están en el formato)
  const otrasActividades = control.actividades.filter(a => !renderedIds.has(a.id));
  if (otrasActividades.length > 0) {
    const hRow = sheet.getRow(currentRow);
    for(let c=1; c<=totalColIndex; c++) {
      hRow.getCell(c).border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
      hRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
    }
    hRow.getCell(2).value = "OTRAS ACTIVIDADES";
    hRow.getCell(2).font = { bold: true };
    currentRow++;

    otrasActividades.forEach(act => {
      const row = sheet.getRow(currentRow);
      for(let c=1; c<=totalColIndex; c++) {
        row.getCell(c).border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
      }
      row.getCell(1).value = controlDate;
      row.getCell(2).value = act.actividad_nombre;
      row.getCell(3).value = act.operario_nombre;

      let rowTotalMs = 0;
      act.intervalos.forEach((interval, index) => {
        if (interval.hora_inicio && index < maxIntervals) {
          const startDate = parseUTC(interval.hora_inicio);
          row.getCell(4 + (index * 2)).value = format(startDate, "HH:mm:ss");
          row.getCell(4 + (index * 2)).alignment = { horizontal: "center" };
          
          if (interval.hora_fin) {
            const endDate = parseUTC(interval.hora_fin);
            row.getCell(5 + (index * 2)).value = format(endDate, "HH:mm:ss");
            row.getCell(5 + (index * 2)).alignment = { horizontal: "center" };
            rowTotalMs += Math.max(0, endDate.getTime() - startDate.getTime());
          }
        }
      });

      if (rowTotalMs > 0) {
        globalTotalMs += rowTotalMs;
        const h = Math.floor(rowTotalMs / 3600000);
        const m = Math.floor((rowTotalMs % 3600000) / 60000);
        const s = Math.floor((rowTotalMs % 60000) / 1000);
        row.getCell(totalColIndex).value = `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        row.getCell(totalColIndex).alignment = { horizontal: "center" };
      }
      currentRow++;
    });
  }

  // Total General
  const totalRow = sheet.getRow(currentRow);
  for(let c=1; c<=totalColIndex; c++) {
    totalRow.getCell(c).border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
  }
  totalRow.getCell(totalColIndex - 1).value = "TOTAL GENERAL:";
  totalRow.getCell(totalColIndex - 1).font = { bold: true };
  totalRow.getCell(totalColIndex - 1).alignment = { horizontal: "right" };
  
  const globalH = Math.floor(globalTotalMs / 3600000);
  const globalM = Math.floor((globalTotalMs % 3600000) / 60000);
  const globalS = Math.floor((globalTotalMs % 60000) / 1000);
  totalRow.getCell(totalColIndex).value = `${globalH}:${globalM.toString().padStart(2, '0')}:${globalS.toString().padStart(2, '0')}`;
  totalRow.getCell(totalColIndex).alignment = { horizontal: "center" };
  totalRow.getCell(totalColIndex).font = { bold: true };
  
  currentRow += 2;

  // Footer
  sheet.getCell(currentRow, 1).value = `Observaciones: ${control.observaciones || ""}`;
  sheet.mergeCells(currentRow, 1, currentRow, 6);
  sheet.getCell(currentRow, 1).font = { bold: true };

  sheet.getCell(currentRow, 7).value = `Registro completado por : ${control.registrado_por_nombre}`;
  sheet.mergeCells(currentRow, 7, currentRow, totalColIndex);

  currentRow++;
  sheet.getCell(currentRow, 1).value = "______________________________________________________";
  sheet.mergeCells(currentRow, 1, currentRow, 6);

  sheet.getCell(currentRow, 7).value = `Revisado y Validado por : ${control.revisado_por_nombre || ""}`;
  sheet.mergeCells(currentRow, 7, currentRow, totalColIndex);

  currentRow++;
  sheet.getCell(currentRow, 7).value = `( Jefe de Manufactura )`;
  sheet.getCell(currentRow, 7).font = { bold: true };
  sheet.mergeCells(currentRow, 7, currentRow, totalColIndex);

  currentRow++;
  sheet.getCell(currentRow, 7).value = `Fecha : ${control.estado === "REVISADO" ? controlDate : ""}`;
  sheet.mergeCells(currentRow, 7, currentRow, totalColIndex);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, `Control_Tiempos_${control.n_lote}_${format(new Date(), "yyyyMMdd")}.xlsx`);
}
