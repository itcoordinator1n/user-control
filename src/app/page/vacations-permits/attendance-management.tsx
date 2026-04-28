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
  const [permitType, setPermitType] = useState<"permiso" | "incapacidad" | "duelo">("permiso")
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
  const [esCompensatorio, setEsCompensatorio] = useState(false)
  const [incapacidadStartDate, setIncapacidadStartDate] = useState<Date>()
  const [incapacidadEndDate, setIncapacidadEndDate] = useState<Date>()
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

  const canShowPermitPreview =
    permitType === "permiso"
      ? permitDate && startTime && endTime && reason && isTimeRangeValid()
      : permitType === "incapacidad"
      ? incapacidadStartDate && incapacidadEndDate && reason && files.length > 0
      : incapacidadStartDate && incapacidadEndDate && reason  // duelo: adjunto opcional

  const handlePermitTypeChange = (type: "permiso" | "incapacidad" | "duelo") => {
    setPermitType(type)
    setPermitDate(undefined)
    setStartTime("")
    setEndTime("")
    setEsCompensatorio(false)
    setIncapacidadStartDate(undefined)
    setIncapacidadEndDate(undefined)
    setFiles([])
  }
  // -------------------------------------

  useEffect(() => {
    const getData = async () => {
      try {
        if (status !== "authenticated") return;
        const token = session && session.user ? session.user.accessToken : undefined;
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
    setEsCompensatorio(false)
    setIncapacidadStartDate(undefined)
    setIncapacidadEndDate(undefined)
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
    <div className="min-h-screen bg-background transition-colors duration-300">
      <div className="container mx-auto p-0 sm:p-4 lg:p-8">
        <h1 className="mb-6 mt-4 ml-4 sm:ml-0 text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Gestión de Asistencia</h1>

        <Tabs defaultValue="permisos" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-lg">
            <TabsTrigger value="permisos" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all rounded-md">
              <span>Permisos</span>
            </TabsTrigger>
            <TabsTrigger value="vacaciones" className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm transition-all rounded-md">
              <span>Vacaciones</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="permisos" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              <Card className="border-0 sm:border border-border/50 shadow-none sm:shadow-sm overflow-hidden bg-card text-card-foreground transition-all duration-300 hover:shadow-md dark:hover:shadow-primary/5">
                <CardHeader className="bg-muted/50 border-b border-border/50 pb-4">
                  <CardTitle className="text-foreground">Solicitud de Permiso</CardTitle>
                  <CardDescription>Completa el formulario para solicitar un permiso laboral</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-6">
                  {/* Selector de tipo */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Tipo de solicitud</Label>
                    <div className="flex gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handlePermitTypeChange("permiso")}
                        className={`flex-1 py-2 px-3 text-sm font-medium rounded-md border transition-colors ${
                          permitType === "permiso"
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:bg-muted/50"
                        }`}
                      >
                        Permiso laboral
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePermitTypeChange("incapacidad")}
                        className={`flex-1 py-2 px-3 text-sm font-medium rounded-md border transition-colors ${
                          permitType === "incapacidad"
                            ? "bg-amber-600 text-white border-amber-600 shadow-sm dark:bg-amber-700 dark:border-amber-700"
                            : "bg-background text-muted-foreground border-border hover:border-amber-500/50 hover:bg-muted/50"
                        }`}
                      >
                        Incapacidad médica
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePermitTypeChange("duelo")}
                        className={`flex-1 py-2 px-3 text-sm font-medium rounded-md border transition-colors ${
                          permitType === "duelo"
                            ? "bg-slate-700 text-white border-slate-700 shadow-sm dark:bg-slate-600 dark:border-slate-600"
                            : "bg-background text-muted-foreground border-border hover:border-slate-500/50 hover:bg-muted/50"
                        }`}
                      >
                        Permiso por duelo
                      </button>
                    </div>
                  </div>

                  {/* Campos para Permiso laboral */}
                  {permitType === "permiso" && (
                    <>
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

                      {startTime && endTime && !isTimeRangeValid() && (
                        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20 font-medium">
                          <AlertCircle className="h-4 w-4" />
                          La hora de finalización debe ser posterior a la de inicio.
                        </div>
                      )}

                      <label className="flex items-center gap-3 cursor-pointer select-none w-fit group">
                        <input
                          type="checkbox"
                          checked={esCompensatorio}
                          onChange={(e) => setEsCompensatorio(e.target.checked)}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-background"
                        />
                        <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                          Tiempo compensatorio
                          <span className="ml-1 text-xs text-muted-foreground">(trabajé fuera de horario)</span>
                        </span>
                      </label>
                    </>
                  )}

                  {/* Campos para Permiso por duelo */}
                  {permitType === "duelo" && (
                    <>
                      <div className="flex items-start gap-3 bg-muted/50 border border-border/50 rounded-md px-4 py-3 text-sm text-muted-foreground">
                        <span className="text-xl leading-none">🕊️</span>
                        <span>Lamentamos tu pérdida. Completa el período de ausencia y el motivo para procesar tu solicitud.</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Fecha de inicio</Label>
                          <DatePicker date={incapacidadStartDate} onDateChange={setIncapacidadStartDate} placeholder="Desde" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Fecha de fin</Label>
                          <DatePicker date={incapacidadEndDate} onDateChange={setIncapacidadEndDate} placeholder="Hasta" />
                        </div>
                      </div>

                      {incapacidadStartDate && incapacidadEndDate && incapacidadEndDate < incapacidadStartDate && (
                        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20 font-medium">
                          <AlertCircle className="h-4 w-4" />
                          La fecha de fin debe ser igual o posterior a la fecha de inicio.
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Documento de respaldo
                          <span className="ml-1 text-xs text-muted-foreground">(opcional — acta o esquela)</span>
                        </Label>
                        <FileUpload onFilesChange={setFiles} maxFiles={1} />
                      </div>
                    </>
                  )}

                  {/* Campos para Incapacidad médica */}
                  {permitType === "incapacidad" && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Fecha de inicio</Label>
                          <DatePicker date={incapacidadStartDate} onDateChange={setIncapacidadStartDate} placeholder="Desde" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Fecha de fin</Label>
                          <DatePicker date={incapacidadEndDate} onDateChange={setIncapacidadEndDate} placeholder="Hasta" />
                        </div>
                      </div>

                      {incapacidadStartDate && incapacidadEndDate && incapacidadEndDate < incapacidadStartDate && (
                        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md border border-destructive/20 font-medium">
                          <AlertCircle className="h-4 w-4" />
                          La fecha de fin debe ser igual o posterior a la fecha de inicio.
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">
                          Comprobante médico <span className="text-destructive">*</span>
                        </Label>
                        <FileUpload onFilesChange={setFiles} maxFiles={1} />
                        {files.length === 0 && (
                          <p className="text-xs text-amber-600 dark:text-amber-500">Adjunta el documento de incapacidad para continuar.</p>
                        )}
                      </div>
                    </>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="reason" className="text-sm font-medium">Motivo</Label>
                    <input
                      id="reason"
                      placeholder="Título breve del motivo"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="permit-comments" className="text-sm font-medium">Comentarios detallados</Label>
                    <RichTextEditor value={permitComments} onChange={setPermitComments} placeholder="Describe detalladamente el motivo..." minHeight="150px" />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" className="flex-1 transition-all">Cancelar</Button>
                    <Button 
                      onClick={() => setShowPermitPreview(true)} 
                      disabled={!canShowPermitPreview}
                      className={`flex-1 transition-all shadow-sm ${canShowPermitPreview ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : ''}`}
                    >
                      Vista previa
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Panel de Información */}
              <Card className="border-0 sm:border border-border/50 shadow-none sm:shadow-sm overflow-hidden bg-card text-card-foreground">
                <CardHeader className="bg-muted/50 border-b border-border/50 pb-4">
                  <CardTitle className="text-foreground flex items-center">
                    <Info className="mr-2 h-5 w-5 text-primary" /> Información
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Tipos de permisos:</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Médicos (Adjuntar cita o incapacidad)</li>
                      <li>• Personales / Académicos / Familiares</li>
                      <li>• Tiempo compensatorio</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Proceso:</h4>
                    <p className="text-xs text-muted-foreground">Sujeto a aprobación por parte de su jefe inmediato.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="mt-6">
              <RequestsTable type="permits" onRequestDeleted={handleRequestDeleted} />
            </div>
          </TabsContent>

          {/* Tab de Vacaciones */}
          <TabsContent value="vacaciones" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              <Card className="border-0 sm:border border-border/50 shadow-none sm:shadow-sm overflow-hidden bg-card text-card-foreground transition-all duration-300 hover:shadow-md dark:hover:shadow-primary/5">
                <CardHeader className="bg-muted/50 border-b border-border/50 pb-4">
                  <CardTitle className="text-foreground">Solicitud de Vacaciones</CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 space-y-6">
                  <div className="bg-primary/5 border border-primary/10 p-5 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-foreground">Días disponibles</h3>
                        <p className="text-sm text-primary">Período 2025-2026</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-extrabold text-foreground tracking-tight">
                          {Number(vacationDays) % 1 === 0 ? Number(vacationDays) : Number(vacationDays).toFixed(2)}
                        </div>
                        <div className="text-sm font-medium text-primary">días</div>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-2 sm:p-4">
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
                    <Button variant="outline" className="flex-1 transition-all">Cancelar</Button>
                    <Button
                      onClick={() => setShowVacationPreview(true)}
                      disabled={!vacationStartDate}
                      className={`flex-1 transition-all shadow-sm ${vacationStartDate ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : ''}`}
                    >
                      Vista previa
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-0 sm:border border-border/50 shadow-none sm:shadow-sm overflow-hidden bg-card text-card-foreground">
                <CardHeader className="bg-muted/50 border-b border-border/50 pb-4">
                  <CardTitle className="text-foreground flex items-center">
                    <Info className="mr-2 h-5 w-5 text-primary" /> Importante
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-xs text-muted-foreground leading-relaxed">
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
          tipo: permitType,
          esCompensatorio,
          date: permitDate,
          startTime,
          endTime,
          incapacidadStartDate,
          incapacidadEndDate,
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