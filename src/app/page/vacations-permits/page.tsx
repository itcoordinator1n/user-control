"use client";

import { CardFooter } from "@/components/ui/card";
import type React from "react";

import { useCallback, useEffect, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TimePickerDemo } from "./time-picker";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CalendarIcon,
  Clock,
  FileText,
  Info,
  Paperclip,
  Pencil,
  Trash2,
  Upload,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { VacationDateSelector } from "@/components/ui/vacation-date-selector";

export default function PermisosVacaciones() {

  type VacationRequests = {
    id: number;
    period: string;
    days: number;
    requestDate: string;
    status: string;
    approver: string;
  };

  type Solicitudes = {
    id: number,
    date: string,
    startTime: string,
    endTime: string,
    status: string,
    approver: string,
  };
  const [vacations, setVacations] = useState<VacationRequests[]>([]);


  const [solicitudes, setSolicitudes] = useState<Solicitudes[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedDays, setSelectedDays] = useState<Date[]>([]);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [showSummary, setShowSummary] = useState(false);
  const [aditionalComment, setAditionalComment] = useState("");
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    startTime: "",
    endTime: "",
    description: "",
    files: [] as File[],
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({
        ...formData,
        files: [...Array.from(e.target.files)],
      });
    }
  };

  useEffect(() => {
    fetch('http://localhost:3000/api/requests/get-my-vacation-requests', {
      method: 'GET',
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.user.accessToken}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Error al obtener solicitudes');
        }
        return res.json();
      })
      .then((data) => setVacations(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [session]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleTimeChange = (time: string, field: "startTime" | "endTime") => {
    setFormData({
      ...formData,
      [field]: time,
    });
  };
  const [responseMessage, setResponseMessage] = useState("");
  const [dias, setDias] = useState<number | 0>(0);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (tipo: string) => {
    if (tipo === "Permiso") {
      // Aquí iría la lógica para enviar el formulario
      setShowSummary(false);

      function combineDateAndTime(date: Date, time: string): Date {
        const [hours, minutes] = time.split(":");

        const combinedDate = new Date(date); // Clonamos la fecha para no modificar el estado original
        combinedDate.setHours(Number(hours));
        combinedDate.setMinutes(Number(minutes));
        combinedDate.setSeconds(0); // Se puede ajustar a 0 o a lo que necesites
        return combinedDate;
      }

      // Función para formatear el objeto Date al formato DATETIME (YYYY-MM-DD HH:MM:SS)
      function formatDateTime(dateObj: Date): string {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        const hours = String(dateObj.getHours()).padStart(2, "0");
        const minutes = String(dateObj.getMinutes()).padStart(2, "0");
        const seconds = String(dateObj.getSeconds()).padStart(2, "0");
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      }

      let startDateTimeFormatted = "";
      let endDateTimeFormatted = "";
      if (date) {
        // Combinar la fecha con startTime y endTime
        const startDateTime = combineDateAndTime(date, formData.startTime);
        const endDateTime = combineDateAndTime(date, formData.endTime);

        // Convertir a formato DATETIME
        startDateTimeFormatted = formatDateTime(startDateTime);
        endDateTimeFormatted = formatDateTime(endDateTime);
      }
      const data = new FormData();
      data.append("fechaInicio", startDateTimeFormatted);
      data.append("fechaFin", endDateTimeFormatted);
      data.append("motivo", formData.description);
      // Si se seleccionó un archivo, lo agregamos (se usa el primero en el array)
      if (formData.files.length > 0) {
        data.append("documento", formData.files[0]);
      }

      try {
        const res = await fetch(
          "http://localhost:3000/api/permissions/request-permission",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session?.user.accessToken}`,
            },
            body: data,
          }
        );
        const response = await res.json();
        if (res.ok) {
          setResponseMessage(response.message);
        } else {
          setResponseMessage(response.error || "Error en la solicitud");
        }
      } catch (error) {
        console.error("Error en la conexión:", error);
        setResponseMessage("Error en la conexión");
      }
    }else {


      const payload = {
        fechaInicio: format(new Date(selectedDays[0]), "yyyy-MM-dd HH:mm:ss"),
        fechaFin: format(new Date(selectedDays[selectedDays.length - 1]), "yyyy-MM-dd HH:mm:ss"),
        comentario: aditionalComment,
      };

      try {
        const res = await fetch("http://localhost:3000/api/permissions/request-vacations", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user.accessToken}`
            
          },
          body: JSON.stringify(payload),
        });
  
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Error al enviar la solicitud");
          setMessage("");
        } else {
          setMessage(data.message);
          setError("");
          // Aquí podrías realizar otras acciones, como redirigir o reiniciar el formulario
        }
      } catch (err) {
        setError("Error interno del cliente.");
        setMessage("");
      }


    }
  };


  
  useEffect(() => {
    fetch(`http://localhost:3000/api/permissions/vacation-days`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session?.user.accessToken}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error al obtener los datos");
        return res.json();
      })
      .then((data) => {
        setDias(data.diasVacaciones);
      })
      .catch((err) => setError(err.message));
  }, [session]);

  useEffect(() => {
    // Ajusta la URL según la configuración de tu endpoint
    fetch('http://localhost:3000/api/requests/get-my-requests', {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session?.user.accessToken}`,
      },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error('Error en la conexión al endpoint');
        }
        return res.json();
      })
      .then((data) => {
        setSolicitudes(data);
        console.log(data)
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [session]);

  const previousRequests = [
    {
      id: 1,
      date: "15/05/2023",
      startTime: "09:00",
      endTime: "13:00",
      status: "Aprobado",
      approver: "Carlos Méndez",
    },
    {
      id: 2,
      date: "22/06/2023",
      startTime: "14:00",
      endTime: "18:00",
      status: "Pendiente",
      approver: "Carlos Méndez",
    },
    {
      id: 3,
      date: "10/07/2023",
      startTime: "08:00",
      endTime: "12:00",
      status: "Rechazado",
      approver: "Carlos Méndez",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Aprobada":
        return <Badge className="bg-green-500">Aprobado</Badge>;
      case "Pendiente":
        return <Badge className="bg-yellow-500">Pendiente</Badge>;
      case "Rechazada":
        return <Badge className="bg-red-500">Rechazado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  const handleSelectionChange = useCallback((days: Date[]) => {
    setSelectedDays(days);
  },[]);

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Gestión de Asistencia</h1>

      <Tabs defaultValue="permisos" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="permisos">Permisos</TabsTrigger>
          <TabsTrigger value="vacaciones">Vacaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="permisos" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Formulario de solicitud */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Solicitud de Permiso</CardTitle>
                <CardDescription>
                  Complete el formulario para solicitar un permiso laboral
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Selector de fecha */}
                  <div className="space-y-2">
                    <Label>Fecha del permiso</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date
                            ? format(date, "PPP", { locale: es })
                            : "Seleccionar fecha"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                          locale={es}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Selector de horario */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="startTime">Hora de inicio</Label>
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        <TimePickerDemo
                          setTime={(time) =>
                            handleTimeChange(time, "startTime")
                          }
                          label="Hora de inicio"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endTime">Hora de finalización</Label>
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        <TimePickerDemo
                          setTime={(time) => handleTimeChange(time, "endTime")}
                          label="Hora de finalización"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Descripción */}
                <div className="space-y-2">
                  <Label htmlFor="description">Motivo del permiso</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describa detalladamente el motivo de su solicitud de permiso..."
                    rows={4}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Adjuntar archivos */}
                <div className="space-y-2">
                  <Label>Documentos justificativos</Label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Paperclip className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Arrastre y suelte archivos aquí o haga clic para
                      seleccionar
                    </p>
                    <Input
                      type="file"
                      className="hidden"
                      id="file-upload"
                      multiple
                      onChange={handleFileChange}
                    />
                    <Button
                      variant="outline"
                      onClick={() =>
                        document.getElementById("file-upload")?.click()
                      }
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Seleccionar archivos
                    </Button>

                    {formData.files.length > 0 && (
                      <div className="mt-4 text-left">
                        <p className="text-sm font-medium mb-2">
                          Archivos seleccionados:
                        </p>
                        <ul className="space-y-1">
                          {formData.files.map((file, index) => (
                            <li
                              key={index}
                              className="text-sm flex items-center"
                            >
                              <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                              {file.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Cancelar</Button>
                <Button onClick={() => setShowSummary(true)}>
                  Vista previa
                </Button>
              </CardFooter>
            </Card>

            {/* Información contextual */}
            <Card>
              <CardHeader>
                <CardTitle>Información</CardTitle>
                <CardDescription>Políticas y recomendaciones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Recordatorio</AlertTitle>
                  <AlertDescription>
                    Las solicitudes de permiso deben realizarse con al menos 24
                    horas de anticipación.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <h4 className="font-medium">Tipos de permisos:</h4>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    <li>Médicos (requiere certificado)</li>
                    <li>Personales (máximo 3 al mes)</li>
                    <li>Académicos (requiere comprobante)</li>
                    <li>Familiares (casos de emergencia)</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Documentación:</h4>
                  <p className="text-sm text-muted-foreground">
                    Para permisos médicos o académicos, es obligatorio adjuntar
                    la documentación correspondiente.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Proceso de aprobación:</h4>
                  <p className="text-sm text-muted-foreground">
                    Su solicitud será revisada por su jefe inmediato. Recibirá
                    una notificación cuando sea aprobada o rechazada.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Solicitudes previas */}
          <Card>
            <CardHeader>
              <CardTitle>Solicitudes Realizadas</CardTitle>
              <CardDescription>
                Historial de solicitudes de permisos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Horario</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Aprobador</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {solicitudes.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{request.date}</TableCell>
                      <TableCell>
                        {request.startTime} - {request.endTime}
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>{request.approver}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={request.status !== "Pendiente"}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={request.status !== "Pendiente"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vacaciones" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Panel principal */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Solicitud de Vacaciones</CardTitle>
                <CardDescription>
                  Seleccione el rango de fechas para sus vacaciones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Información de días disponibles */}
                <div className="bg-primary/10 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-lg">
                      Días de vacaciones disponibles
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Período 2023-2024
                    </p>
                  </div>
                  <div className="text-center">
                    <span className="text-4xl font-bold text-primary">
                      {dias}
                    </span>
                    <p className="text-sm text-muted-foreground">días</p>
                  </div>
                </div>

                {/* Selección de fechas */}
                <div className="space-y-4">
                  <VacationDateSelector
                    availableDays={dias}
                    onSelectionChange={handleSelectionChange}
                  />

                  {/* Visualización de días seleccionados */}

                  {/* Comentarios adicionales */}
                  <div className="space-y-2">
                    <Label htmlFor="comments">Comentarios adicionales</Label>
                    <Textarea
                      id="comments"
                      name="comments"
                      value={aditionalComment}
                      onChange={(e) => setAditionalComment(e.target.value)}
                      placeholder="Agregue cualquier información adicional sobre su solicitud de vacaciones..."
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Cancelar</Button>
                <Button onClick={() => setShowSummary(true)}>
                  Vista previa
                </Button>
              </CardFooter>
            </Card>

            {/* Panel de información */}
            <Card>
              <CardHeader>
                <CardTitle>Información</CardTitle>
                <CardDescription>Políticas y recomendaciones</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Recordatorio</AlertTitle>
                  <AlertDescription>
                    Las solicitudes de vacaciones deben realizarse con al menos
                    2 semanas de anticipación.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <h4 className="font-medium">Períodos de vacaciones:</h4>
                  <ul className="list-disc pl-5 text-sm space-y-1">
                    <li>Mínimo 5 días consecutivos</li>
                    <li>Máximo 15 días consecutivos</li>
                    <li>No acumulables para el siguiente año</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Temporadas de alta demanda:</h4>
                  <p className="text-sm text-muted-foreground">
                    Durante los meses de julio, agosto y diciembre, las
                    solicitudes deben realizarse con mayor anticipación.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Proceso de aprobación:</h4>
                  <p className="text-sm text-muted-foreground">
                    Su solicitud será revisada por su jefe inmediato. Recibirá
                    una notificación cuando sea aprobada o rechazada.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Solicitudes previas */}
          <Card>
            <CardHeader>
              <CardTitle>Solicitudes Realizadas</CardTitle>
              <CardDescription>
                Historial de solicitudes de vacaciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Período</TableHead>
                    <TableHead>Días</TableHead>
                    <TableHead>Fecha de solicitud</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Aprobador</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vacations.map((v,index)=>(

                    <TableRow key={index}>
                      <TableCell>{v.period}</TableCell>
                      <TableCell>{v.days}</TableCell>
                      <TableCell>{v.requestDate}</TableCell>
                      <TableCell>{getStatusBadge("Aprobada")}</TableCell>
                      <TableCell>{v.approver}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de resumen */}
      {showSummary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Resumen de Solicitud</CardTitle>
              <CardDescription>
                Revise los detalles antes de enviar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Fecha:</p>
                  <p className="text-sm">
                    {date
                      ? format(date, "PPP", { locale: es })
                      : "No seleccionada"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Horario:</p>
                  <p className="text-sm">
                    {formData.startTime || "--:--"} a{" "}
                    {formData.endTime || "--:--"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium">Motivo:</p>
                <p className="text-sm">
                  {formData.description || "No especificado"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium">Documentos adjuntos:</p>
                {formData.files.length > 0 ? (
                  <ul className="text-sm">
                    {formData.files.map((file, index) => (
                      <li key={index}>{file.name}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm">No hay documentos adjuntos</p>
                )}
              </div>

              <div>
                <p className="text-sm font-medium">Aprobador:</p>
                <p className="text-sm">Carlos Méndez (Jefe de Departamento)</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setShowSummary(false)}>
                Volver a editar
              </Button>
              <Button onClick={() => handleSubmit("Permiso")}>
                Enviar para aprobación
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
      {/* Modal de detalle de vacaciones */}
      {showSummary && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Resumen de Solicitud de Vacaciones</CardTitle>
              <CardDescription>
                Revise los detalles antes de enviar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Fecha de inicio:</p>
                  <p className="text-sm">
                    {date
                      ? format(date, "PPP", { locale: es })
                      : "No seleccionada"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Fecha de finalización:</p>
                  <p className="text-sm">
                    {date
                      ? format(
                          new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000),
                          "PPP",
                          { locale: es }
                        )
                      : "No seleccionada"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium">Total de días:</p>
                <p className="text-sm">8 días</p>
              </div>

              <div>
                <p className="text-sm font-medium">
                  Días disponibles restantes:
                </p>
                <p className="text-sm">7 días (de 15 disponibles)</p>
              </div>

              <div>
                <p className="text-sm font-medium">Comentarios:</p>
                <p className="text-sm">No se han agregado comentarios</p>
              </div>

              <div>
                <p className="text-sm font-medium">Aprobador:</p>
                <p className="text-sm">Carlos Méndez (Jefe de Departamento)</p>
              </div>

              <Alert className="bg-amber-50 text-amber-800 border-amber-200">
                <Info className="h-4 w-4" />
                <AlertTitle>Importante</AlertTitle>
                <AlertDescription className="text-amber-800">
                  Una vez enviada, la solicitud no podrá modificarse hasta que
                  sea revisada por su supervisor.
                </AlertDescription>
              </Alert>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setShowSummary(false)}>
                Volver a editar
              </Button>
              <Button onClick={() => handleSubmit("Vacaciones")}>
                Enviar para aprobación
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
