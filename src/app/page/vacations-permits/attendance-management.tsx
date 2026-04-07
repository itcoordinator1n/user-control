"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Info, AlertCircle } from "lucide-react" // Añadido AlertCircle para feedback
import { DatePicker } from "./components/date-picker"
import { TimePicker } from "./components/time-picker"
import { VacationCalendar } from "./components/vacation-calendar"
import { FileUpload } from "./components/file-upload"
import { PermitPreview } from "./components/permits-preview"
import { VacationPreview } from "./components/vacation-preview"
import { RequestsTable } from "./components/requests-table"
import { ToastNotification } from "./components/toast-notification"
import { RichTextEditor } from "./components/rich-text-editor"
import { useSession } from "next-auth/react"

export default function AttendanceManagement() {
  const [permitDate, setPermitDate] = useState<Date>()
  const { data: session, status } = useSession()
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [reason, setReason] = useState("")
  const [vacationDays, setvacationDays] = useState(0)
  const [permitComments, setPermitComments] = useState("")
  const [vacationStartDate, setVacationStartDate] = useState<Date | null>(null)
  const [halfDay, setHalfDay] = useState(false);
  const [vacationEndDate, setVacationEndDate] = useState<Date | null>(null)
  const [vacationComments, setVacationComments] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [showPermitPreview, setShowPermitPreview] = useState(false)
  const [showVacationPreview, setShowVacationPreview] = useState(false)
  const [toast, setToast] = useState<{
    show: boolean
    type: "success" | "error" | "info" | "warning"
    title: string
    message: string
  }>({
    show: false,
    type: "success",
    title: "",
    message: "",
  })

  // --- Lógica de Validación de Horas ---
  const isTimeRangeValid = () => {
    if (!startTime || !endTime) return false;
    // Asumiendo formato HH:mm (24h) de las strings
    return startTime < endTime;
  }

  const canShowPermitPreview = permitDate && startTime && endTime && reason && isTimeRangeValid();
  // -------------------------------------

  useEffect(() => {
    const getData = async () => {
      try {
        if (status !== "authenticated") return;
        const token = session?.user?.accessToken
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/permissions/vacation-days`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        setvacationDays(data.diasVacaciones || 0)
      } catch (error: any) {
        console.error("Error al obtener días:", error.message || error)
      }
    }
    getData();
  }, [status, session]);

  const showToast = (type: "success" | "error" | "info" | "warning", title: string, message: string) => {
    setToast({ show: true, type, title, message })
  }

  const handlePermitSubmitSuccess = () => {
    showToast("success", "Solicitud Enviada", "Tu solicitud de permiso ha sido enviada correctamente.")
    setPermitDate(undefined)
    setStartTime("")
    setEndTime("")
    setReason("")
    setPermitComments("")
    setFiles([])
  }

  const handleVacationSubmitSuccess = () => {
    showToast("success", "Solicitud Enviada", "Tu solicitud de vacaciones ha sido enviada correctamente.")
    setVacationStartDate(null)
    setVacationEndDate(null)
    setVacationComments("")
    setHalfDay(false)
  }

  const handleRequestDeleted = () => {
    showToast("info", "Solicitud Eliminada", "La solicitud ha sido eliminada correctamente.")
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto p-4">
        <h1 className="mb-6 text-2xl font-bold text-blue-900">Gestión de Asistencia</h1>

        <Tabs defaultValue="permisos" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white">
            <TabsTrigger value="permisos" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
              <span>Permisos</span>
            </TabsTrigger>
            <TabsTrigger value="vacaciones" className="data-[state=active]:bg-blue-400 data-[state=active]:text-white">
              <span>Vacaciones</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="permisos" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              <Card>
                <CardHeader className="bg-blue-50 border-b">
                  <CardTitle className="text-blue-900">Solicitud de Permiso</CardTitle>
                  <CardDescription>Completa el formulario para solicitar un permiso laboral</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="permit-date" className="text-sm font-medium">Fecha del permiso</Label>
                    <DatePicker date={permitDate} onDateChange={setPermitDate} placeholder="Seleccionar fecha" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Hora de inicio</Label>
                      <TimePicker value={startTime} onChange={setStartTime} placeholder="HH:MM" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Hora de finalización</Label>
                      <TimePicker value={endTime} onChange={setEndTime} placeholder="HH:MM" />
                    </div>
                  </div>

                  {/* Feedback visual si la hora es inválida */}
                  {startTime && endTime && !isTimeRangeValid() && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">
                      <AlertCircle className="h-4 w-4" />
                      La hora de finalización debe ser posterior a la de inicio.
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="reason" className="text-sm font-medium">Motivo del permiso</Label>
                    <input
                      id="reason"
                      placeholder="Título breve del motivo"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="permit-comments" className="text-sm font-medium">Comentarios detallados</Label>
                    <RichTextEditor value={permitComments} onChange={setPermitComments} placeholder="Describe detalladamente el motivo..." minHeight="150px" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Documentos justificativos</Label>
                    <FileUpload onFilesChange={setFiles} />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" className="flex-1">Cancelar</Button>
                    <Button 
                      onClick={() => setShowPermitPreview(true)} 
                      disabled={!canShowPermitPreview}
                      className={`flex-1 ${canShowPermitPreview ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300'}`}
                    >
                      Vista previa
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Panel de Información */}
              <Card>
                <CardHeader className="bg-blue-50 border-b">
                  <CardTitle className="text-blue-900 flex items-center">
                    <Info className="mr-2 h-5 w-5" /> Información
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Tipos de permisos:</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• Médicos (Adjuntar cita o incapacidad)</li>
                      <li>• Personales / Académicos / Familiares</li>
                      <li>• Tiempo compensatorio</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Proceso:</h4>
                    <p className="text-xs text-gray-600">Sujeto a aprobación por parte de su jefe inmediato.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="mt-6">
              <RequestsTable type="permits" onRequestDeleted={handleRequestDeleted} />
            </div>
          </TabsContent>

          {/* Tab de Vacaciones - Mantenido similar pero con validación de botón */}
          <TabsContent value="vacaciones" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              <Card>
                <CardHeader className="bg-blue-50 border-b">
                  <CardTitle className="text-blue-900">Solicitud de Vacaciones</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-blue-900">Días disponibles</h3>
                        <p className="text-sm text-blue-700">Período 2025-2026</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-blue-900">{vacationDays}</div>
                        <div className="text-sm text-blue-700">días</div>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <VacationCalendar
                      startDate={vacationStartDate || undefined}
                      endDate={vacationEndDate || undefined}
                      onDateRangeChange={(start, end) => {
                        setVacationStartDate(start)
                        setVacationEndDate(end)
                      }}
                      availableDays={vacationDays}
                      halfDay={halfDay} 
                      setHalfDay={setHalfDay}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" className="flex-1">Cancelar</Button>
                    <Button
                      onClick={() => setShowVacationPreview(true)}
                      disabled={!vacationStartDate}
                      className={`flex-1 ${vacationStartDate ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300'}`}
                    >
                      Vista previa
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="bg-blue-50 border-b">
                  <CardTitle className="text-blue-900 flex items-center">
                    <Info className="mr-2 h-5 w-5" /> Importante
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-xs text-gray-600">
                    Los días solicitados serán descontados de su saldo tras la aprobación de la jefatura y Recursos Humanos.
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="mt-6">
              <RequestsTable type="vacations" onRequestDeleted={handleRequestDeleted} />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <PermitPreview
        open={showPermitPreview}
        onOpenChange={setShowPermitPreview}
        data={{
          date: permitDate,
          startTime,
          endTime,
          reason,
          comments: permitComments,
          files,
        }}
        onSubmitSuccess={handlePermitSubmitSuccess}
      />

      <VacationPreview
        open={showVacationPreview}
        onOpenChange={setShowVacationPreview}
        data={{
          startDate: vacationStartDate,
          endDate: vacationEndDate,
          comments: vacationComments,
          halfDay: halfDay
        }}
        onSubmitSuccess={handleVacationSubmitSuccess}
      />

      <ToastNotification
        show={toast.show}
        type={toast.type}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast({ ...toast, show: false })}
      />
    </div>
  )
}