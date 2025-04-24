"use client";

import { useEffect, useState } from "react";
import { CalendarIcon, ClockIcon, UserIcon } from "lucide-react";
import {
  format,
  parseISO,
  isAfter,
  isBefore,
  setHours,
  setMinutes,
  getDay,
} from "date-fns";
import { es } from "date-fns/locale";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useSession } from "next-auth/react";

// Mock data to simulate database results - expanded for pagination demo
const mockData = [
  {
    hora_entrada: "2023-05-15T07:05:00",
    hora_salida: "2023-05-15T16:00:00",
    estado: "Completado",
    fecha: "2023-05-15",
  },
  {
    hora_entrada: "2023-05-16T07:20:00", // Late entry
    hora_salida: "2023-05-16T16:00:00",
    estado: "Completado",
    fecha: "2023-05-16",
  },
  {
    hora_entrada: "2023-05-17T06:55:00",
    hora_salida: "2023-05-17T15:30:00", // Early departure for Admin
    estado: "Completado",
    fecha: "2023-05-17",
  },
  {
    hora_entrada: "2023-05-18T07:00:00",
    hora_salida: null,
    estado: "Pendiente",
    fecha: "2023-05-18",
  },
  {
    hora_entrada: "2023-05-19T07:10:00", // Friday
    hora_salida: "2023-05-19T14:50:00", // Early departure for Admin on Friday
    estado: "Completado",
    fecha: "2023-05-19",
  },
  {
    hora_entrada: "2023-05-22T07:05:00",
    hora_salida: "2023-05-22T16:00:00",
    estado: "Completado",
    fecha: "2023-05-22",
  },
  {
    hora_entrada: "2023-05-23T07:30:00", // Late entry
    hora_salida: "2023-05-23T16:00:00",
    estado: "Completado",
    fecha: "2023-05-23",
  },
  {
    hora_entrada: "2023-05-24T06:50:00",
    hora_salida: "2023-05-24T15:30:00", // Early departure for Admin
    estado: "Completado",
    fecha: "2023-05-24",
  },
  {
    hora_entrada: "2023-05-25T07:00:00",
    hora_salida: null,
    estado: "Pendiente",
    fecha: "2023-05-25",
  },
  {
    hora_entrada: "2023-05-26T07:10:00", // Friday
    hora_salida: "2023-05-26T14:50:00", // Early departure for Admin on Friday
    estado: "Completado",
    fecha: "2023-05-26",
  },
  {
    hora_entrada: "2023-05-29T07:05:00",
    hora_salida: "2023-05-29T16:00:00",
    estado: "Completado",
    fecha: "2023-05-29",
  },
  {
    hora_entrada: "2023-05-30T07:20:00", // Late entry
    hora_salida: "2023-05-30T16:00:00",
    estado: "Completado",
    fecha: "2023-05-30",
  },
];

type Asistencia = {
  hora_entrada: string | null;
  hora_salida: string | null;
  estado: string;
  fecha: string;
};

export default function AttendanceTable() {
  const [historial, setHistorial] = useState<Asistencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [department, setDepartment] = useState("administrative");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const { data: session, status } = useSession();

  useEffect(() => {
    const obtenerHistorial = async () => {
      try {
        const response = await fetch("http://localhost:3000/api/attendance/attendance-history", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user.accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        setHistorial(data);
        console.log(data)
      } catch (err: any) {
        setError(err.message || "Ocurrió un error");
      } finally {
        setLoading(false);
      }
    };

    obtenerHistorial();
  }, [session]);

  // Function to check if entry is late (after 7:15 AM)
  const isLateEntry = (entryTime: string) => {
    const entryDate = parseISO(entryTime);
    const lateThreshold = new Date(entryDate);
    lateThreshold.setHours(7, 15, 0);
    return isAfter(entryDate, lateThreshold);
  };

  // Function to check if departure is early based on department and day of week
  const isEarlyDeparture = (exitTime: string | null, date: string) => {
    if (!exitTime) return false;

    const exitDate = parseISO(exitTime);
    const dayOfWeek = getDay(parseISO(date));
    const isFriday = dayOfWeek === 5;

    let expectedDepartureTime = new Date(exitDate);

    if (department === "administrative") {
      // Administrative: 4:00 PM (3:00 PM on Fridays)
      if (isFriday) {
        expectedDepartureTime = setHours(
          setMinutes(expectedDepartureTime, 0),
          15
        );
      } else {
        expectedDepartureTime = setHours(
          setMinutes(expectedDepartureTime, 0),
          16
        );
      }
    } else {
      // Production: 4:45 PM (3:45 PM on Fridays)
      if (isFriday) {
        expectedDepartureTime = setHours(
          setMinutes(expectedDepartureTime, 45),
          15
        );
      } else {
        expectedDepartureTime = setHours(
          setMinutes(expectedDepartureTime, 45),
          16
        );
      }
    }

    return isBefore(exitDate, expectedDepartureTime);
  };

  // Format time from ISO string
  const formatTime = (timeString: string | null) => {
    if (!timeString) return "-";
    return format(parseISO(timeString), "h:mm a", { locale: es });
  };

  // Format date from ISO string
  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "dd/MM/yyyy", { locale: es });
  };

  // Pagination logic
  const totalPages = Math.ceil(historial.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = historial.slice(indexOfFirstItem, indexOfLastItem);

  // Generate page numbers for pagination
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Registro de Asistencia</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px]">Fecha</TableHead>
              <TableHead>Hora de Entrada</TableHead>
              <TableHead>Hora de Salida</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentItems.map((record, index) => (
              <TableRow
                key={index}
                className={
                  record.estado === "Completado" ? "bg-green-50" : "bg-gray-50"
                }
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    {formatDate(record.fecha)}
                  </div>
                </TableCell>
                <TableCell>
                  <div
                    className={`flex items-center gap-2 ${
                      isLateEntry(record.hora_entrada)
                        ? "text-red-600 font-medium"
                        : ""
                    }`}
                  >
                    <ClockIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{formatTime(record.hora_entrada)}</span>
                    {isLateEntry(record.hora_entrada) && (
                      <Badge variant="destructive" className="ml-2">
                        Tarde
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div
                    className={`flex items-center gap-2 ${
                      record.hora_salida &&
                      isEarlyDeparture(record.hora_salida, record.fecha)
                        ? "text-amber-600 font-medium"
                        : ""
                    }`}
                  >
                    <ClockIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{formatTime(record.hora_salida)}</span>
                    {record.hora_salida &&
                      isEarlyDeparture(record.hora_salida, record.fecha) && (
                        <Badge
                          variant="outline"
                          className="ml-2 border-amber-500 text-amber-600"
                        >
                          Salida anticipada
                        </Badge>
                      )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      record.estado === "Completado" ? "default" : "secondary"
                    }
                  >
                    {record.estado}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Mostrando {indexOfFirstItem + 1}-
            {Math.min(indexOfLastItem, historial.length)} de {historial.length}{" "}
            registros
          </span>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => {
              setItemsPerPage(Number.parseInt(value));
              setCurrentPage(1); // Reset to first page when changing items per page
            }}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue placeholder="5" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="15">15</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className={
                  currentPage === 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>

            {pageNumbers.map((number) => (
              <PaginationItem key={number}>
                <PaginationLink
                  onClick={() => setCurrentPage(number)}
                  isActive={currentPage === number}
                >
                  {number}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                className={
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </CardFooter>
    </Card>
  );
}
