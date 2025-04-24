"use client";
import {
  Clock,
  HelpCircle,
  User,
  MapPin,
  Building,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import {
  addHours,
  differenceInSeconds,
  formatDistanceToNow,
  isBefore,
} from "date-fns";
import AttendanceTable from "@/components/attendance-table";

interface UserProfile {
  id: number;
  name: string;
  position: string;
  creationDate: string;
  area: string;
  country: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const [accumulatedTime, setAccumulatedTime] = useState(0); // in seconds
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [entryDate, setEntryDate] = useState<Date | null>(null);
  const [exitDate, setExitDate] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [remainingTime, setRemainingTime] = useState<string>("");
  interface EntryDateResponse {
    entryDate: string;
  }

  useEffect(() => {
    if (session?.user.accessToken) {
      const fetchEntryDate = async () => {
        try {
          setLoading(true);
          const res = await fetch(
            "http://localhost:3000/api/attendance/attendance-get-entry",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session?.user.accessToken}`,
              },
            }
          );

          if (!res.ok) {
            throw new Error(`Error ${res.status}: ${res.statusText}`);
          }

          const data: EntryDateResponse = await res.json();
          const entry = new Date(data.entryDate);
          if (data.entryDate !== "1970-01-01 00:00:00") {
            const now = new Date();
            setAccumulatedTime(differenceInSeconds(now, entry));
            setEntryDate(entry);

            // Calcular la hora de salida sumando 9 horas
            const calculatedExitDate = addHours(entry, 9);
            setExitDate(calculatedExitDate);
            // Calcular los segundos transcurridos y el tiempo restante
            const interval = setInterval(() => {
              setAccumulatedTime((prev) => prev + 1);
            }, 1000);
            // const interval = setInterval(() => {
            //   const now = new Date();
            //   setElapsedSeconds(differenceInSeconds(now, entry));

            //   setAccumulatedTime(differenceInSeconds(now, entry))

            //   // Calcular tiempo restante
            //   if (isBefore(now, calculatedExitDate)) {
            //     setRemainingTime(formatDistanceToNow(calculatedExitDate, { addSuffix: true }));
            //   } else {
            //     setRemainingTime('Jornada completa');
            //   }
            // }, 1000);

            return () => clearInterval(interval);
          }
        } catch (error) {
          console.error("Error al obtener la fecha de entrada:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchEntryDate();
    }
  }, [session]);

  const handleMarkEntry = async () => {
    try {
      const res = await fetch(
        "http://localhost:3000/api/attendance/attendance-entry",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user.accessToken}`,
          },
        }
      );
      const data = await res.json();
      if (res.ok) {
        setAccumulatedTime(0);
        const interval = setInterval(() => {
          setAccumulatedTime((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
      } else {
        if (data.error === "Ya se registró la entrada para hoy") {
        } else {
          setError("Error al cargar los datos de tiempo");
        }
      }
    } catch (err) {
      setError("Error al conectar con el servidor");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const handleMarkExit = async () => {
    try {
      const res = await fetch(
        "http://localhost:3000/api/attendance/attendance-exit",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user.accessToken}`,
          },
        }
      );
      const data = await res.json();
      if (res.ok) {
      } else {
      }
    } catch (err) {
      setError("Error al conectar con el servidor");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Asegúrate de que el token esté disponible
    if (session?.user?.accessToken) {
      fetch("http://localhost:3000/api/profile/profile_info", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session?.user.accessToken}`,
        },
      })
        .then((res) => {
          if (!res.ok) {
            throw new Error("Error al obtener el perfil");
          }
          return res.json();
        })
        .then((data: UserProfile) => {
          setProfile(data);
        })
        .catch((err: Error) => setError(err.message));
    }
  }, [session]);

  // Format time as HH:MM:SS
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const date = new Date(profile?.creationDate as string);
  const formattedDate = date.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const palabras = profile?.name.trim().split(/\s+/);
  // Toma la primera letra de las dos primeras palabras
  const iniciales = palabras
    ?.slice(0, 2)
    .map((p) => p[0])
    .join("");
  const userName = iniciales?.toUpperCase();

  // Calculate progress percentage (9 hours = 32400 seconds)
  const progressPercentage = Math.min((accumulatedTime / 32400) * 100, 100);

  // Format hours and minutes for display
  const hours = Math.floor(accumulatedTime / 3600);
  const minutes = Math.floor((accumulatedTime % 3600) / 60);
  const progressText = `${hours}h ${minutes}m de 9h (${progressPercentage.toFixed(
    1
  )}%)`;
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto p-4">
        <h1 className="mb-6 text-2xl font-bold text-center sm:text-left">
          Sistema de Asistencia Laboral
        </h1>

        <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
          {/* Perfil del Usuario */}
          <Card className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage
                  src="/placeholder.svg?height=96&width=96"
                  alt="Foto de perfil"
                />
                <AvatarFallback>{userName}</AvatarFallback>
              </Avatar>
              <div className="text-center">
                <h2 className="text-xl font-bold">{profile?.name}</h2>
                <p className="text-muted-foreground">{profile?.position}</p>
              </div>

              <div className="w-full space-y-2">
                <div className="flex items-center text-sm">
                  <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{profile?.area}</span>
                </div>
                <div className="flex items-center text-sm">
                  <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{profile?.country}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{formattedDate}</span>
                </div>
              </div>

              <div className="w-full pt-4">
                <Button variant="outline" className="w-full" size="sm">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Ayuda y Soporte
                </Button>
              </div>
            </div>
          </Card>

          {/* Pantalla de Marcaje */}
          <Card className="p-6">
            <Tabs defaultValue="marcaje" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="marcaje">Marcaje</TabsTrigger>
                <TabsTrigger value="historial">Historial</TabsTrigger>
              </TabsList>

              <TabsContent value="marcaje" className="space-y-6 pt-4">
                <div className="flex flex-col items-center space-y-2 ">
                  <div className="text-center">
                    <h3 className="text-lg font-medium">
                      Tiempo Acumulado Hoy
                    </h3>
                    <div className="mt-2 text-4xl font-bold">
                      {loading ? (
                        <div className="animate-pulse">Cargando...</div>
                      ) : error ? (
                        <div className="text-red-500 text-base">{error}</div>
                      ) : (
                        <TimeDisplay time={formatTime(accumulatedTime)} />
                      )}
                    </div>
                  </div>

                  <div className="w-full pt-2">
                    <div className="flex justify-between text-sm mb-1">
                      <span>0h</span>
                      <span>4:30h</span>
                      <span>9h</span>
                    </div>
                    <Progress value={progressPercentage} className="h-3" />
                    <p className="mt-1 text-xs text-center text-muted-foreground">
                      {loading ? "Calculando..." : progressText}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Entrada</p>
                      <p className="text-lg">
                        {entryDate?.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "numeric",
                          hour12: true,
                        }) || "00:00 AM"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Salida Estimada</p>
                      <p className="text-lg">
                        {exitDate?.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "numeric",
                          hour12: true,
                        }) || "00:00 PM"}
                      </p>
                    </div>
                  </div>

                  <Alert className="bg-amber-50 border-amber-200">
                    <AlertDescription className="text-amber-800">
                      Recuerda que debes completar 8 horas de trabajo diario.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      size="lg"
                      onClick={() => handleMarkEntry()}
                    >
                      Marcar Entrada
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => handleMarkExit()}
                    >
                      Marcar Salida
                    </Button>
                  </div>
                </div>

                <div className="pt-4">
                  <h3 className="text-sm font-medium mb-2">Acceso Rápido</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="ghost" className="justify-start" size="sm">
                      Manual de Usuario
                    </Button>
                    <Button variant="ghost" className="justify-start" size="sm">
                      Preguntas Frecuentes
                    </Button>
                    <Button variant="ghost" className="justify-start" size="sm">
                      Reportar Problema
                    </Button>
                    <Button variant="ghost" className="justify-start" size="sm">
                      Solicitar Permiso
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="historial">
                <div className="py-8 text-center text-muted-foreground">
                  Aquí podrás ver tu historial de asistencia.
                </div>
                <AttendanceTable></AttendanceTable>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface TimeDisplayProps {
  time?: string;
}

function TimeDisplay({ time = "00:00:00" }: TimeDisplayProps) {
  return (
    <div className="flex items-center justify-center">
      <Clock className="mr-2 h-6 w-6 text-muted-foreground" />
      <span>{time}</span>
    </div>
  );
}
