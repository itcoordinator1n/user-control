"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  ChevronDown,
  Clock,
  Download,
  Filter,
  Search,
  User,
  Users,
  X,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { saveAs } from "file-saver";
import { useSession } from "next-auth/react";
import { WaitModal } from "../../vacations-permits/components/wait-modal";
import { 
  Request, 
  VacationRequest, 
  isVacationRequest, 
  getRequestSubtype 
} from "./types";
import { RequestDetailModal } from "./request-detail-modal";

const TYPE_LABELS: Record<string, string> = {
  vacation: "Vacaciones",
  "vacation-halfday": "Vacaciones — ½ Día",
  permiso: "Permiso",
  incapacidad: "Incapacidad",
  duelo: "Duelo",
  compensatorio: "Compensatorio",
};

const SPANISH_MONTHS: Record<string, number> = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
  julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
};

const parseRecordDate = (s: string): Date | null => {
  if (!s) return null;
  const isoAttempt = new Date(s.replace(" ", "T"));
  if (!isNaN(isoAttempt.getTime())) return isoAttempt;
  const m = s.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i);
  if (!m) return null;
  const month = SPANISH_MONTHS[m[2].toLowerCase()];
  if (month === undefined) return null;
  return new Date(Number(m[3]), month, Number(m[1]));
};

const getRecordStartDate = (r: Request): Date | null => {
  if (r.type === "permit") {
    return parseRecordDate((r as any).startDateTime ?? (r as any).date ?? "");
  }
  return parseRecordDate((r as any).startDate ?? "");
};

export default function SupervisorDashboard() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [allRecords, setAllRecords] = useState<Request[]>([]);
  const clientModeRef = useRef(false);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [supervisorComments, setSupervisorComments] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [waitStatus, setWaitStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [waitAction, setWaitAction] = useState<"approve" | "reject">("approve");
  const [waitError, setWaitError] = useState("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [fetchedEmployees, setFetchedEmployees] = useState<{ id: string; name: string; department: string }[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [employeePanelOpen, setEmployeePanelOpen] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const { data: session, status } = useSession();

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const hasActiveFilters = filterType !== "all" || filterStatus !== "all" || dateFrom !== "" || dateTo !== "" || selectedEmployeeIds.length > 0;

  const availableEmployees = useMemo(() => {
    if (fetchedEmployees.length > 0) return fetchedEmployees;
    if (allRecords.length === 0) return [];
    const seen = new Map<string, { id: string; name: string; department: string }>();
    allRecords.forEach((r) => {
      if (!seen.has(r.employeeName))
        seen.set(r.employeeName, { id: r.employeeName, name: r.employeeName, department: r.department ?? "" });
    });
    return Array.from(seen.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [fetchedEmployees, allRecords]);

  const filteredEmployeeList = useMemo(() => availableEmployees.filter((e) => e.name.toLowerCase().includes(employeeSearch.toLowerCase())), [availableEmployees, employeeSearch]);

  const availableTypes = useMemo(() => {
    const seen = new Set(Object.keys(TYPE_LABELS));
    allRecords.forEach((r) => seen.add(getRequestSubtype(r)));
    return Array.from(seen).sort();
  }, [allRecords]);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.accessToken) return;
    setEmployeesLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/permissions/my-team`, {
      headers: { Authorization: `Bearer ${session?.user?.accessToken}` },
    })
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((json: any) => {
        const list = (json.data ?? json).map((e: any) => ({
          id: String(e.id ?? e.id_usuario ?? e.employeeId ?? e.name ?? ""),
          name: e.name ?? e.txt_nombre ?? e.employeeName ?? "",
          department: e.department ?? e.txt_area ?? e.area ?? "",
        }));
        setFetchedEmployees(list.filter((e: any) => e.name).sort((a: any, b: any) => a.name.localeCompare(b.name)));
      })
      .catch(() => {})
      .finally(() => setEmployeesLoading(false));
  }, [session, status]);

  useEffect(() => { setCurrentPage(1); }, [filterType, filterStatus, itemsPerPage, dateFrom, dateTo, selectedEmployeeIds]);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.accessToken || clientModeRef.current) return;
    const params = new URLSearchParams({ page: currentPage.toString(), limit: itemsPerPage.toString(), sortOrder: "desc" });
    if (filterType !== "all") {
      // Si es un subtipo como 'vacation-halfday', enviamos el tipo base 'vacation' a la API
      const apiType = filterType.startsWith("vacation") ? "vacation" : 
                     (filterType === "permit" || filterType === "incapacidad" || filterType === "duelo" || filterType === "compensatorio") ? "permit" : 
                     filterType;
      params.set("type", apiType);
    }
    if (filterStatus !== "all") params.set("status", filterStatus);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (selectedEmployeeIds.length > 0) params.set("employees", selectedEmployeeIds.join(","));

    setIsLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/permissions/get-all-request-to-me?${params}`, { headers: { Authorization: `Bearer ${session?.user?.accessToken}` } })
      .then((res) => res.ok ? res.json() : Promise.reject("Error"))
      .then((json: any) => {
        if (json.data) {
          let data = json.data;
          // Filtrado local para subtipos si la API no los maneja
          if (filterType !== "all" && !filterType.includes("vacation") && filterType !== "permit") {
             data = data.filter((r: any) => getRequestSubtype(r) === filterType);
          }
          if (filterType === "vacation-halfday") {
             data = data.filter((r: any) => (r as any).halfDay === true);
          }
          
          setRequests(data);
          setTotalCount(json.total ?? data.length);
        } else {
          clientModeRef.current = true;
          const permits = (json.permits ?? []).map((p: any) => ({ ...p, type: "permit" as const }));
          const vacations = (json.vacations ?? []).map((v: any) => ({ ...v, type: "vacation" as const }));
          setAllRecords([...permits, ...vacations]);
        }
      })
      .catch((err) => setError(err))
      .finally(() => setIsLoading(false));
  }, [session, status, currentPage, itemsPerPage, filterType, filterStatus, dateFrom, dateTo, selectedEmployeeIds]);

  useEffect(() => {
    if (!clientModeRef.current || allRecords.length === 0) return;
    let filtered = allRecords;
    if (filterType !== "all") filtered = filtered.filter((r) => getRequestSubtype(r) === filterType);
    if (filterStatus !== "all") filtered = filtered.filter((r) => r.status === filterStatus);
    if (dateFrom) {
      const from = new Date(dateFrom);
      filtered = filtered.filter((r) => { const d = getRecordStartDate(r); return d ? d >= from : true; });
    }
    if (dateTo) {
      const to = new Date(dateTo); to.setHours(23, 59, 59, 999);
      filtered = filtered.filter((r) => { const d = getRecordStartDate(r); return d ? d <= to : true; });
    }
    if (selectedEmployeeIds.length > 0) {
      const selectedNames = availableEmployees.filter((e) => selectedEmployeeIds.includes(e.id)).map((e) => e.name);
      filtered = filtered.filter((r) => selectedNames.includes(r.employeeName));
    }
    setTotalCount(filtered.length);
    const start = (currentPage - 1) * itemsPerPage;
    setRequests(filtered.slice(start, start + itemsPerPage));
  }, [allRecords, availableEmployees, filterType, filterStatus, dateFrom, dateTo, selectedEmployeeIds, currentPage, itemsPerPage]);

  const handleApprove = async (actionStatus: string) => {
    if (!selectedRequest) return;
    const isApproving = actionStatus === "Aprobada";
    setWaitAction(isApproving ? "approve" : "reject");
    setWaitStatus("loading");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/permissions/handle-request`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.user?.accessToken}` },
        body: JSON.stringify({ id: selectedRequest.id, status: actionStatus, comments: supervisorComments }),
      });
      if (!res.ok) throw new Error("Error");
      setRequests((prev) => prev.map((r) => r.id === selectedRequest.id ? { ...r, status: actionStatus as any, comments: supervisorComments } : r));
      setWaitStatus("success");
    } catch (e) {
      setWaitError("Error");
      setWaitStatus("error");
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({ sortOrder: "desc" });
      if (filterType !== "all") params.set("type", filterType);
      if (filterStatus !== "all") params.set("status", filterStatus);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      if (selectedEmployeeIds.length > 0) params.set("employees", selectedEmployeeIds.join(","));
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/permissions/export?${params}`, { headers: { Authorization: `Bearer ${session?.user?.accessToken}` } });
      if (!res.ok) throw new Error();
      saveAs(await res.blob(), `solicitudes_${new Date().toISOString().split("T")[0]}.xlsx`);
    } catch (err) { alert("Error"); }
    finally { setIsExporting(false); }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, string> = { 
      Pendiente: "bg-yellow-100 text-yellow-800", 
      Aprobada: "bg-green-100 text-green-800", 
      Rechazada: "bg-red-100 text-red-800" 
    };
    return <Badge className={configs[status] || "bg-gray-100"}>{status === "Aprobada" ? "Aprobado" : status}</Badge>;
  };

  const paginationPages = useMemo(() => {
    const windowSize = Math.min(5, totalPages);
    let start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    if (totalPages <= 5) start = 1;
    return Array.from({ length: windowSize }, (_, i) => start + i);
  }, [totalPages, currentPage]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Solicitudes</h1>
          <Button onClick={handleExport} disabled={isExporting} className="bg-blue-600">
            {isExporting ? "Generando..." : "Exportar Excel"}
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" /> Filtros</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tipo de solicitud</Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {availableTypes.map((t) => <SelectItem key={t} value={t}>{TYPE_LABELS[t] || t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                    <SelectItem value="Aprobada">Aprobado</SelectItem>
                    <SelectItem value="Rechazada">Rechazado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Empleados</Label>
                <Popover open={employeePanelOpen} onOpenChange={setEmployeePanelOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span className="truncate">
                        {selectedEmployeeIds.length === 0 ? "Todos los empleados" : `${selectedEmployeeIds.length} seleccionados`}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-0">
                    <div className="p-3 border-b">
                      <Input placeholder="Buscar..." value={employeeSearch} onChange={(e) => setEmployeeSearch(e.target.value)} className="h-8" />
                    </div>
                    <div className="max-h-60 overflow-y-auto p-1">
                      {filteredEmployeeList.map((emp) => (
                        <div key={emp.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 cursor-pointer" onClick={() => setSelectedEmployeeIds(prev => prev.includes(emp.id) ? prev.filter(id => id !== emp.id) : [...prev, emp.id])}>
                          <Checkbox checked={selectedEmployeeIds.includes(emp.id)} />
                          <span className="text-sm truncate">{emp.name}</span>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Desde</Label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full h-10 px-3 rounded-md border text-sm" />
              </div>

              <div className="space-y-2">
                <Label>Hasta</Label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full h-10 px-3 rounded-md border text-sm" />
              </div>
            </div>

            {hasActiveFilters && (
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => { setFilterType("all"); setFilterStatus("all"); setDateFrom(""); setDateTo(""); setSelectedEmployeeIds([]); }} className="text-blue-600">
                  <X className="h-4 w-4 mr-1" /> Limpiar filtros
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Solicitudes recibidas</CardTitle></CardHeader>
          <CardContent>
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Empleado</TableHead><TableHead>Tipo</TableHead><TableHead>Fecha</TableHead><TableHead>Estado</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((r) => (
                    <TableRow key={r.id} className="cursor-pointer hover:bg-gray-50" onClick={() => { setSelectedRequest(r); setSupervisorComments(r.comments || ""); setIsDetailOpen(true); }}>
                      <TableCell>{r.employeeName}</TableCell>
                      <TableCell>{TYPE_LABELS[getRequestSubtype(r)] || r.type}</TableCell>
                      <TableCell>{r.submittedDate}</TableCell>
                      <TableCell>{getStatusBadge(r.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="md:hidden space-y-4">
              {requests.map((r) => (
                <div key={r.id} className="bg-white border rounded-lg p-4" onClick={() => { setSelectedRequest(r); setIsDetailOpen(true); }}>
                  <div className="flex justify-between font-bold mb-2"><span>{r.id}</span>{getStatusBadge(r.status)}</div>
                  <div className="text-sm font-medium">{r.employeeName}</div>
                  <div className="text-xs text-gray-500 mt-1">{TYPE_LABELS[getRequestSubtype(r)]}</div>
                </div>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {paginationPages.map((p) => <Button key={p} variant={currentPage === p ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(p)}>{p}</Button>)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <RequestDetailModal 
        isOpen={isDetailOpen} 
        onOpenChange={setIsDetailOpen} 
        selectedRequest={selectedRequest} 
        supervisorComments={supervisorComments} 
        onCommentsChange={setSupervisorComments} 
        onApprove={handleApprove} 
        waitStatus={waitStatus} 
        getStatusBadge={getStatusBadge} 
      />

      <WaitModal isOpen={waitStatus !== "idle"} status={waitStatus === "idle" ? "loading" : waitStatus} title={waitStatus === "loading" ? "Procesando..." : "Finalizado"} onClose={() => setWaitStatus("idle")} />
    </div>
  );
}
