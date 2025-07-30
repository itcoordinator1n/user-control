"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Info } from "lucide-react"
import { DatePicker } from "./components/date-picker"
import { TimePicker } from "./components/time-picker"
import { VacationCalendar } from "./components/vacation-calendar"
import { FileUpload } from "./components/file-upload"
import { PermitPreview } from "./components/permits-preview"
import { VacationPreview } from "./components/vacation-preview"
import { RequestsTable } from "./components/requests-table"
import { NotificationPill } from "./components/notification-pill"
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
  useEffect(() => {
    const getData = async () => {
      try {
        console.log()
        if (status !== "authenticated") {
          throw new Error("No estás autenticado")
        }

        const token = session.user.accessToken
        const res = await fetch("https://infarma.duckdns.org/api/permissions/vacation-days", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            // NO Content-Type: lo gestiona automáticamente FormData
          },
        })

        
        const data = await res.json()
        setvacationDays(data.diasVacaciones || 0)
        console.log("Dias de vacaciones",data)

      } catch (error: any) {
        console.error("handleSubmit error:", error.message || error)
      }
    }
    getData();
  }, []);



  // Simulamos notificaciones - en una app real esto vendría del backend
  const [permitNotifications, setPermitNotifications] = useState(2)
  const [vacationNotifications, setVacationNotifications] = useState(1)

  const showToast = (type: "success" | "error" | "info" | "warning", title: string, message: string) => {
    setToast({ show: true, type, title, message })
  }

  const handlePermitSubmitSuccess = () => {
    showToast(
      "success",
      "Solicitud Enviada",
      "Tu solicitud de permiso ha sido enviada correctamente y está pendiente de aprobación.",
    )
    // Limpiar formulario
    setPermitDate(undefined)
    setStartTime("")
    setEndTime("")
    setReason("")
    setPermitComments("")
    setFiles([])
  }

  const handleVacationSubmitSuccess = () => {
    showToast(
      "success",
      "Solicitud Enviada",
      "Tu solicitud de vacaciones ha sido enviada correctamente y está pendiente de aprobación.",
    )
    // Limpiar formulario
    setVacationStartDate(null)
    setVacationEndDate(null)
    setVacationComments("")
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
              {/*
              <NotificationPill count={permitNotifications} />
              
              */}
            </TabsTrigger>
            <TabsTrigger value="vacaciones" className="data-[state=active]:bg-blue-400 data-[state=active]:text-white">
              <span>Vacaciones</span>
              {/*
                <NotificationPill count={vacationNotifications} />
              */}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="permisos" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              {/* Formulario de Solicitud */}
              <Card>
                <CardHeader className="bg-blue-50 border-b">
                  <CardTitle className="text-blue-900">Solicitud de Permiso</CardTitle>
                  <CardDescription>Completa el formulario para solicitar un permiso laboral</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Fecha del permiso */}
                  <div className="space-y-2">
                    <Label htmlFor="permit-date" className="text-sm font-medium">
                      Fecha del permiso
                    </Label>
                    <DatePicker
                      date={permitDate}
                      onDateChange={setPermitDate}
                      placeholder="Seleccionar fecha del permiso"
                    />
                  </div>

                  {/* Horas */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Hora de inicio</Label>
                      <TimePicker value={startTime} onChange={setStartTime} placeholder="Hora de inicio" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Hora de finalización</Label>
                      <TimePicker value={endTime} onChange={setEndTime} placeholder="Hora de finalización" />
                    </div>
                  </div>

                  {/* Motivo del permiso */}
                  <div className="space-y-2">
                    <Label htmlFor="reason" className="text-sm font-medium">
                      Motivo del permiso
                    </Label>
                    <input
                      id="reason"
                      placeholder="Título breve del motivo"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Comentarios detallados */}
                  <div className="space-y-2">
                    <Label htmlFor="permit-comments" className="text-sm font-medium">
                      Comentarios detallados
                    </Label>
                    <RichTextEditor
                      value={permitComments}
                      onChange={setPermitComments}
                      placeholder="Describe detalladamente el motivo de tu solicitud de permiso..."
                      minHeight="150px"
                    />
                  </div>

                  {/* Documentos justificativos */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Documentos justificativos</Label>
                    <FileUpload onFilesChange={setFiles} />
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" className="flex-1">
                      Cancelar
                    </Button>
                    <Button onClick={() => setShowPermitPreview(true)} className="flex-1 bg-blue-600 hover:bg-blue-700">
                      Vista previa
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Panel de Información */}
              <Card>
                <CardHeader className="bg-blue-50 border-b">
                  <CardTitle className="text-blue-900 flex items-center">
                    <Info className="mr-2 h-5 w-5" />
                    Información
                  </CardTitle>
                  <CardDescription>Políticas y recomendaciones</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Recordatorio</p>
                        <p className="text-xs text-blue-700 mt-1">
                          Las solicitudes de permiso deben realizarse con al menos 24 horas de anticipación.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Tipos de permisos:</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• Médicos (requiere certificado)</li>
                      <li>• Personales (máximo 3 al mes)</li>
                      <li>• Académicos (requiere comprobante)</li>
                      <li>• Familiares (casos de emergencia)</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Documentación:</h4>
                    <p className="text-xs text-gray-600">
                      Para permisos médicos o académicos es obligatorio adjuntar la documentación correspondiente.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Proceso de aprobación:</h4>
                    <p className="text-xs text-gray-600">
                      Su solicitud será revisada por su jefe inmediato. Recibirá una notificación cuando sea aprobada o
                      rechazada.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabla de Solicitudes de Permisos */}
            <div className="mt-6">
              <RequestsTable type="permits" onRequestDeleted={handleRequestDeleted} />
            </div>
          </TabsContent>

          <TabsContent value="vacaciones" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              {/* Formulario de Solicitud de Vacaciones */}
              <Card>
                <CardHeader className="bg-blue-50 border-b">
                  <CardTitle className="text-blue-900">Solicitud de Vacaciones</CardTitle>
                  <CardDescription>Selecciona el rango de fechas para tus vacaciones</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Días disponibles */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-medium text-blue-900">Días de vacaciones disponibles</h3>
                        <p className="text-sm text-blue-700">Período 2023-2024</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-blue-900">{vacationDays}</div>
                        <div className="text-sm text-blue-700">días</div>
                      </div>
                    </div>
                  </div>

                  {/* Selector de Vacaciones */}
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">Selector de Vacaciones</h4>
                      <span className="text-sm text-blue-600">{vacationDays} días disponibles</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">Selecciona un rango de fechas para tus vacaciones</p>

                    <VacationCalendar
                      startDate={vacationStartDate || undefined}
                      endDate={vacationEndDate || undefined}
                      onDateRangeChange={(start, end) => {
                        setVacationStartDate(start)
                        setVacationEndDate(end)
                      }}
                      availableDays={0}
                    />
                  </div>

                  {/* Comentarios adicionales */}
                  <div className="space-y-2">
                    <Label htmlFor="vacation-comments" className="text-sm font-medium">
                      Comentarios adicionales
                    </Label>
                    <RichTextEditor
                      value={vacationComments}
                      onChange={setVacationComments}
                      placeholder="Agregue cualquier información adicional sobre su solicitud de vacaciones..."
                      minHeight="150px"
                    />
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" className="flex-1">
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => setShowVacationPreview(true)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
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
                    <Info className="mr-2 h-5 w-5" />
                    Información
                  </CardTitle>
                  <CardDescription>Políticas y recomendaciones</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Recordatorio</p>
                        <p className="text-xs text-blue-700 mt-1">
                          Las solicitudes de vacaciones deben realizarse con al menos 2 semanas de anticipación.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Períodos de vacaciones:</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• Mínimo 5 días consecutivos</li>
                      <li>• Máximo 15 días consecutivos</li>
                      <li>• No acumulables para el siguiente año</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Temporadas de alta demanda:</h4>
                    <p className="text-xs text-gray-600">
                      Durante los meses de julio, agosto y diciembre las solicitudes deben realizarse con mayor
                      anticipación.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Proceso de aprobación:</h4>
                    <p className="text-xs text-gray-600">
                      Su solicitud será revisada por su jefe inmediato. Recibirá una notificación cuando sea aprobada o
                      rechazada.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabla de Solicitudes de Vacaciones */}
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
