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
  let interval: NodeJS.Timeout;
  let isMounted = true;

  if (session?.user?.accessToken) {
    const fetchEntryDate = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/attendance/attendance-get-entry`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user?.accessToken}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }

        const data: EntryDateResponse = await res.json();
        const entry = new Date(data.entryDate);

        if (data.entryDate !== "1970-01-01 00:00:00") {
          const now = new Date();
          if (!isMounted) return;

          setAccumulatedTime(differenceInSeconds(now, entry));
          setEntryDate(entry);

          const calculatedExitDate = addHours("1970-01-01 00:00:00", 16.75);
          setExitDate(calculatedExitDate);

          interval = setInterval(() => {
            setAccumulatedTime((prev) => prev + 1);
          }, 1000);
        }
      } catch (err) {
        console.error("Error al obtener la fecha de entrada:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEntryDate();
  }

  return () => {
    isMounted = false;
    if (interval) clearInterval(interval);
  };
}, []);



  const handleMarkEntry = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/attendance/attendance-entry`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user?.accessToken}`,
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
        `${process.env.NEXT_PUBLIC_API_URL}/api/attendance/attendance-exit`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user?.accessToken}`,
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
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/profile_info`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session?.user?.accessToken}`,
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
    <div className="min-h-screen bg-background transition-colors duration-300">
      <div className="container mx-auto p-4 lg:p-8">
        <h1 className="mb-6 text-3xl font-extrabold tracking-tight text-center sm:text-left bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Sistema de Asistencia Laboral
        </h1>

        <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
          {/* Perfil del Usuario */}
          <Card className="p-6 relative overflow-hidden transition-all duration-300 hover:shadow-xl dark:hover:shadow-primary/5 dark:bg-slate-900/60 dark:backdrop-blur-xl dark:border-slate-800/60 border border-slate-200">
            {/* Ambient Glow */}
            <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full bg-primary/20 blur-[3rem] pointer-events-none" />
            
            <div className="flex flex-col items-center space-y-4 relative z-10">
              <Avatar className="h-28 w-28 ring-4 ring-primary/20 ring-offset-2 ring-offset-background transition-transform duration-300 hover:scale-105">
                <AvatarImage
                  src={undefined}
                  alt="Foto de perfil"
                />
                <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">{userName}</AvatarFallback>
              </Avatar>
              <div className="text-center space-y-1">
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

              <div className="w-full pt-6">
                <Button variant="outline" className="w-full transition-all duration-300 hover:bg-primary hover:text-primary-foreground hover:shadow-md hover:-translate-y-0.5 border-primary/20" size="sm">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Ayuda y Soporte
                </Button>
              </div>
            </div>
          </Card>

          {/* Pantalla de Marcaje */}
          <Card className="p-6 relative overflow-hidden transition-all duration-300 hover:shadow-xl dark:hover:shadow-primary/5 dark:bg-slate-900/60 dark:backdrop-blur-xl dark:border-slate-800/60 border border-slate-200">
            {/* Ambient Glow */}
            <div className="absolute top-1/2 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-primary/10 blur-[4rem] pointer-events-none" />
            
            <Tabs defaultValue="marcaje" className="w-full relative z-10">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="marcaje">Marcaje</TabsTrigger>
                <TabsTrigger value="historial">Historial</TabsTrigger>
              </TabsList>

              <TabsContent value="marcaje" className="space-y-8 pt-6">
                <div className="flex flex-col items-center space-y-4">
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-muted-foreground uppercase tracking-wider text-sm">
                      Tiempo Acumulado Hoy
                    </h3>
                    <div className="mt-4">
                      {loading ? (
                        <div className="animate-pulse text-4xl font-mono text-muted">--:--:--</div>
                      ) : error ? (
                        <div className="text-destructive text-base font-medium">{error}</div>
                      ) : (
                        <TimeDisplay time={formatTime(accumulatedTime)} />
                      )}
                    </div>
                  </div>

                  <div className="w-full pt-6 px-2">
                    <div className="flex justify-between text-xs font-medium text-muted-foreground mb-2 px-1">
                      <span>0h</span>
                      <span>4:30h</span>
                      <span>9h</span>
                    </div>
                    <div className="relative">
                      <Progress value={progressPercentage} className="h-3 bg-secondary overflow-hidden shadow-inner" />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent w-full h-full animate-[shimmer_2s_infinite] pointer-events-none opacity-50" style={{ transform: 'translateX(-100%)' }} />
                    </div>
                    <p className="mt-3 text-xs text-center font-medium text-muted-foreground">
                      {loading ? "Calculando..." : progressText}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col space-y-6 pt-6">
                  <div className="grid grid-cols-2 gap-6 bg-slate-100 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                    <div className="space-y-2 flex flex-col items-center justify-center text-center">
                      <div className="p-2 bg-background rounded-full shadow-sm mb-1">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Entrada</p>
                      <p className="text-xl font-bold tracking-tight">
                        {entryDate?.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "numeric",
                          hour12: true,
                        }) || "--:--"}
                      </p>
                    </div>
                    <div className="space-y-2 flex flex-col items-center justify-center text-center relative">
                      {/* Separator Line */}
                      <div className="absolute left-0 top-1/4 bottom-1/4 w-px bg-slate-300 dark:bg-slate-700"></div>
                      <div className="p-2 bg-background rounded-full shadow-sm mb-1">
                        <Clock className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Hora de Salida</p>
                      <p className="text-xl font-bold tracking-tight">
                        {exitDate?.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "numeric",
                          hour12: true,
                        }) || "--:--"}
                      </p>
                    </div>
                  </div>

                  
                  
                  {/* 
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
                  */}
                </div>

                <div className="pt-6">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 px-1">Acceso Rápido</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="ghost" className="justify-start transition-all duration-200 hover:translate-x-1 hover:bg-primary/10 hover:text-primary rounded-xl h-12" size="sm">
                      Manual de Usuario
                    </Button>
                    <Button variant="ghost" className="justify-start transition-all duration-200 hover:translate-x-1 hover:bg-primary/10 hover:text-primary rounded-xl h-12" size="sm">
                      Preguntas Frecuentes
                    </Button>
                    <Button variant="ghost" className="justify-start transition-all duration-200 hover:translate-x-1 hover:bg-primary/10 hover:text-primary rounded-xl h-12" size="sm">
                      Reportar Problema
                    </Button>
                    <Button variant="ghost" className="justify-start transition-all duration-200 hover:translate-x-1 hover:bg-primary/10 hover:text-primary rounded-xl h-12" size="sm">
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
    <div className="flex items-center justify-center space-x-3">
      <Clock className="h-8 w-8 text-primary/80 animate-pulse drop-shadow-sm" />
      <span className="font-mono text-5xl tracking-tight font-black bg-gradient-to-br from-foreground to-foreground/60 dark:from-white dark:to-white/60 bg-clip-text text-transparent drop-shadow-sm">
        {time}
      </span>
    </div>
  );
}
