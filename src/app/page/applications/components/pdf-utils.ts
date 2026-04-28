import jsPDF from "jspdf";
import "jspdf-autotable";
import { Request, isVacationRequest, isPermitRequest } from "./types";

export const generatePDF = (request: Request) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  let yPosition = 30;

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(
    "SOLICITUD DE " + (request.type === "vacation" ? "VACACIONES" : "PERMISO"),
    pageWidth / 2,
    yPosition,
    { align: "center" }
  );

  yPosition += 15;
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text(`ID: ${request.id}`, pageWidth / 2, yPosition, { align: "center" });

  yPosition += 20;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("INFORMACIÓN DEL EMPLEADO", margin, yPosition);
  yPosition += 10;

  doc.setFontSize(11);
  const employeeInfo = [
    ["Nombre:", request.employeeName],
    ["Departamento:", request.department],
    ["Cargo:", request.position],
    ["Fecha de Solicitud:", request.submittedDate],
  ];

  employeeInfo.forEach(([label, value]) => {
    doc.setFont("helvetica", "bold");
    doc.text(label, margin, yPosition);
    doc.setFont("helvetica", "normal");
    doc.text(value, margin + 40, yPosition);
    yPosition += 8;
  });

  yPosition += 10;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("DETALLES DE LA SOLICITUD", margin, yPosition);
  yPosition += 10;

  doc.setFontSize(11);
  if (isVacationRequest(request)) {
    const details = [
      ["Tipo:", "Vacaciones"],
      ["Período:", request.period],
      ["Inicio:", request.startDate],
      ["Fin:", request.endDate],
      ["Días:", `${request.days} (${request.workDays} laborables)`],
    ];
    details.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, margin, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(value, margin + 40, yPosition);
      yPosition += 8;
    });
  } else if (isPermitRequest(request)) {
    const details = [
      ["Tipo:", "Permiso"],
      ["Fecha:", request.date],
      ["Horario:", request.timeRange],
      ["Motivo:", request.reason],
    ];
    details.forEach(([label, value]) => {
      doc.setFont("helvetica", "bold");
      doc.text(label, margin, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(value, margin + 40, yPosition);
      yPosition += 8;
    });
  }

  yPosition += 10;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("ESTADO", margin, yPosition);
  yPosition += 10;
  doc.setFontSize(11);
  doc.text(`Estado: ${request.status}`, margin, yPosition);
  yPosition += 15;

  if (request.employeeComments) {
    doc.text("Comentarios:", margin, yPosition);
    yPosition += 7;
    const splitText = doc.splitTextToSize(request.employeeComments, pageWidth - margin * 2);
    doc.text(splitText, margin, yPosition);
  }

  const fileName = `${request.type}_${request.id}.pdf`;
  doc.save(fileName);
};
