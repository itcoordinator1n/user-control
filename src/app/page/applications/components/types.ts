export interface PermitRequest {
  id: string;
  employeeName: string;
  date: string;
  timeRange: string;
  reason: string;
  tipo?: "permiso" | "incapacidad" | "duelo";
  compensatorio?: boolean;
  startDateTime?: string;
  endDateTime?: string;
  status: "Pendiente" | "Aprobada" | "Rechazada";
  approver: string;
  submittedDate: string;
  responseDate?: string;
  comments?: string;
  employeeComments?: string;
  department: string;
  position: string;
  attachments?: Array<{
    name: string;
    type: string;
    url: string;
  }>;
}

export interface VacationRequest {
  id: string;
  employeeName: string;
  period: string;
  days: number;
  workDays: number;
  halfDay?: boolean;
  status: "Pendiente" | "Aprobada" | "Rechazada";
  approver: string;
  submittedDate: string;
  responseDate?: string;
  comments?: string;
  employeeComments?: string;
  startDate: string;
  endDate: string;
  department: string;
  position: string;
}

export type Request = (PermitRequest | VacationRequest) & {
  type: "permit" | "vacation";
};

export const isVacationRequest = (req: Request): req is Request & VacationRequest => {
  return req.type === "vacation";
};

export const isPermitRequest = (req: Request): req is Request & PermitRequest => {
  return req.type === "permit";
};

export const getRequestSubtype = (r: Request): string => {
  if (r.type === "vacation") {
    return (r as any).halfDay ? "vacation-halfday" : "vacation";
  }
  const perm = r as any;
  if (perm.compensatorio) return "compensatorio";
  return perm.tipo ?? "permiso";
};
