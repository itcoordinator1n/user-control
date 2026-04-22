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
  { tipo: "actividad", label: "Codificar frasco" }
];

export async function exportControlToExcel(control: ProduccionControl) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Control de Tiempos");

  // --- HEADER CONFIGURATION ---
  sheet.getColumn("A").width = 12; // Fecha
  sheet.getColumn("B").width = 30; // Actividad
  sheet.getColumn("C").width = 30; // Operario
  sheet.getColumn("D").width = 10; // DE 1
  sheet.getColumn("E").width = 10; // HASTA 1
  sheet.getColumn("F").width = 10; // DE 2
  sheet.getColumn("G").width = 10; // HASTA 2
  sheet.getColumn("H").width = 10; // DE 3
  sheet.getColumn("I").width = 10; // HASTA 3
  sheet.getColumn("J").width = 15; // TOTAL HORAS

  // 1. Top Header Box
  sheet.mergeCells("A1:B3");
  sheet.getCell("A1").value = "Infarma"; // Placeholder for Logo
  sheet.getCell("A1").alignment = { vertical: "middle", horizontal: "center" };
  sheet.getCell("A1").font = { bold: true, size: 16, color: { argb: "FF004080" } };
  
  sheet.mergeCells("C1:I3");
  sheet.getCell("C1").value = "HOJA CONTROL DE TIEMPOS DE PRODUCCION: ALIMENTOS";
  sheet.getCell("C1").alignment = { vertical: "middle", horizontal: "center" };
  sheet.getCell("C1").font = { bold: true, size: 12 };

  sheet.mergeCells("J1:J2");
  sheet.getCell("J1").value = "CÓDIGO: RO-OP-068";
  sheet.getCell("J1").alignment = { vertical: "middle", horizontal: "center" };
  sheet.getCell("J1").font = { size: 8 };

  sheet.getCell("J3").value = "Versión: 02";
  sheet.getCell("J3").font = { size: 8 };

  sheet.mergeCells("A4:C4");
  sheet.getCell("A4").value = "Elaborado por : Josué Molina\nRevisado y modificado por: Patricia Palma";
  sheet.getCell("A4").alignment = { wrapText: true, vertical: "top" };
  sheet.getCell("A4").font = { size: 7 };

  sheet.mergeCells("D4:G4");
  sheet.getCell("D4").value = "Fecha de primera versión: 25-08-2010\nFecha de última versión: 20-05-2013";
  sheet.getCell("D4").alignment = { wrapText: true, vertical: "top" };
  sheet.getCell("D4").font = { size: 7 };

  sheet.getCell("H4").value = "Página 1 de 1";
  sheet.getCell("H4").font = { size: 8 };
  sheet.getCell("H4").alignment = { vertical: "middle", horizontal: "center" };

  sheet.getCell("J4").value = "Revisado por:\nJefe de Manufactura";
  sheet.getCell("J4").alignment = { wrapText: true, vertical: "top" };
  sheet.getCell("J4").font = { size: 7 };

  // Borders for top header
  const topHeaderRange = ["A1:B3", "C1:I3", "J1:J2", "J3", "A4:C4", "D4:G4", "H4:I4", "J4"];
  // We apply border to each cell in the range 1-4 manually
  for (let r = 1; r <= 4; r++) {
    for (let c = 1; c <= 10; c++) {
      const cell = sheet.getCell(r, c);
      cell.border = {
        top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" }
      };
    }
  }

  // 2. Info variables
  sheet.mergeCells("A6:C6");
  sheet.getCell("A6").value = `Proceso : ${control.proceso}`;
  sheet.getCell("A6").font = { bold: true, size: 12 };

  sheet.mergeCells("D6:J6");
  sheet.getCell("D6").value = `Producto: ${control.producto_nombre}`;
  sheet.getCell("D6").font = { bold: true, size: 12 };

  sheet.mergeCells("A7:C7");
  sheet.getCell("A7").value = `Nº de Lote: ${control.n_lote}`;
  sheet.getCell("A7").font = { bold: true, size: 12 };

  sheet.mergeCells("D7:J7");
  sheet.getCell("D7").value = `O/P: ${control.op}`;
  sheet.getCell("D7").font = { bold: true, size: 12 };

  // 3. Table Headers
  sheet.getRow(9).values = ["Fecha", "Actividad", "Operario", "", "", "", "", "", "", "TOTAL"];
  sheet.getRow(10).values = ["", "", "Nombre y Apellido", "DE", "HASTA", "DE", "HASTA", "DE", "HASTA", "HORAS"];
  
  sheet.mergeCells("A9:A10");
  sheet.mergeCells("B9:B10");
  sheet.mergeCells("C9:C9"); // Operario merges above Nombre y Apellido
  sheet.mergeCells("J9:J10"); // TOTAL HORAS

  // Center align table headers
  for(let i=1; i<=10; i++) {
    const c9 = sheet.getCell(9, i);
    const c10 = sheet.getCell(10, i);
    c9.alignment = { vertical: 'middle', horizontal: 'center' };
    c9.font = { bold: true };
    c9.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    
    c10.alignment = { vertical: 'middle', horizontal: 'center' };
    c10.font = { bold: true, size: 10 };
    c10.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
  }

  // 4. Fill Table
  let currentRow = 11;
  const controlDate = format(new Date(control.fecha), "dd/MM/yyyy");
  let globalTotalMs = 0;

  FORMATO_ACTIVIDADES.forEach((item) => {
    const row = sheet.getRow(currentRow);
    // Base Borders
    for(let c=1; c<=10; c++) {
      row.getCell(c).border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    }

    if (item.tipo === "header") {
      row.getCell(2).value = item.label;
      row.getCell(2).font = { bold: true };
    } else if (item.tipo === "actividad") {
      row.getCell(2).value = item.label;
      
      // Find matching activity data
      // Check if there's any activity matching this label
      const matchedAct = control.actividades.find(a => a.actividad_nombre === item.label);
      
      if (matchedAct) {
        row.getCell(1).value = controlDate; // Fecha
        row.getCell(3).value = matchedAct.operario_nombre; // Operario
        
        // Intervalos (up to 3 pairs supported in this specific layout)
        let rowTotalMs = 0;
        
        matchedAct.intervalos.forEach((interval, index) => {
          if (index > 2) return; // The template only has 3 columns for DE/HASTA
          
          if (interval.hora_inicio) {
            const startDate = new Date(interval.hora_inicio);
            const startStr = format(startDate, "HH:mm");
            row.getCell(4 + (index * 2)).value = startStr;
            row.getCell(4 + (index * 2)).alignment = { horizontal: "center" };
            
            if (interval.hora_fin) {
              const endDate = new Date(interval.hora_fin);
              const endStr = format(endDate, "HH:mm");
              row.getCell(5 + (index * 2)).value = endStr;
              row.getCell(5 + (index * 2)).alignment = { horizontal: "center" };
              
              // Calculate diff
              const diffMs = endDate.getTime() - startDate.getTime();
              rowTotalMs += Math.max(0, diffMs);
            }
          }
        });

        if (rowTotalMs > 0) {
          globalTotalMs += rowTotalMs;
          const h = Math.floor(rowTotalMs / (1000 * 60 * 60));
          const m = Math.floor((rowTotalMs % (1000 * 60 * 60)) / (1000 * 60));
          row.getCell(10).value = `${h}:${m.toString().padStart(2, '0')}`;
          row.getCell(10).alignment = { horizontal: "center" };
        }
      }
    }
    
    currentRow++;
  });

  // Render total general at the end of the table
  const totalRow = sheet.getRow(currentRow);
  for(let c=1; c<=10; c++) {
    totalRow.getCell(c).border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
  }
  totalRow.getCell(9).value = "TOTAL GENERAL:";
  totalRow.getCell(9).font = { bold: true };
  totalRow.getCell(9).alignment = { horizontal: "right" };
  
  const globalH = Math.floor(globalTotalMs / (1000 * 60 * 60));
  const globalM = Math.floor((globalTotalMs % (1000 * 60 * 60)) / (1000 * 60));
  totalRow.getCell(10).value = `${globalH}:${globalM.toString().padStart(2, '0')}`;
  totalRow.getCell(10).alignment = { horizontal: "center" };
  totalRow.getCell(10).font = { bold: true };
  
  currentRow++;

  // 5. Footer / Observaciones
  currentRow += 2;
  sheet.getCell(`A${currentRow}`).value = `Observaciones: ${control.observaciones || ""}`;
  sheet.mergeCells(`A${currentRow}:G${currentRow}`);
  sheet.getCell(`A${currentRow}`).font = { bold: true };

  sheet.getCell(`H${currentRow}`).value = `Registro completado por : ${control.registrado_por_nombre}`;
  sheet.mergeCells(`H${currentRow}:J${currentRow}`);

  currentRow++;
  sheet.getCell(`A${currentRow}`).value = "______________________________________________________";
  sheet.mergeCells(`A${currentRow}:G${currentRow}`);

  sheet.getCell(`H${currentRow}`).value = `Revisado y Validado por : ${control.revisado_por_nombre || ""}`;
  sheet.mergeCells(`H${currentRow}:J${currentRow}`);

  currentRow++;
  sheet.getCell(`A${currentRow}`).value = "______________________________________________________";
  sheet.mergeCells(`A${currentRow}:G${currentRow}`);

  sheet.getCell(`H${currentRow}`).value = `( Jefe de Manufactura )`;
  sheet.getCell(`H${currentRow}`).font = { bold: true };
  sheet.mergeCells(`H${currentRow}:J${currentRow}`);

  currentRow++;
  sheet.getCell(`H${currentRow}`).value = `Fecha : ${control.estado === "REVISADO" ? controlDate : ""}`;
  sheet.mergeCells(`H${currentRow}:J${currentRow}`);

  // Generar y descargar
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, `Control_Tiempos_${control.n_lote}_${format(new Date(), "yyyyMMdd")}.xlsx`);
}
