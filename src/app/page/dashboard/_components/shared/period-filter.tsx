"use client";

import { Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** "attendance" → Hoy / Esta Semana / Este Mes / Último Trimestre / Este Año
 *  "general"    → Este Mes / Último Trimestre / Este Año / Año Anterior / Comparación Interanual */
type PeriodVariant = "attendance" | "general";

interface PeriodFilterProps {
  value: string;
  onChange: (value: string) => void;
  variant?: PeriodVariant;
}

export function PeriodFilter({ value, onChange, variant = "general" }: PeriodFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-48">
        <Calendar className="h-4 w-4 mr-2" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {variant === "attendance" ? (
          <>
            <SelectItem value="Hoy">Hoy</SelectItem>
            <SelectItem value="Esta Semana">Esta Semana</SelectItem>
            <SelectItem value="Este Mes">Este Mes</SelectItem>
            <SelectItem value="Último Trimestre">Último Trimestre</SelectItem>
            <SelectItem value="Este Año">Este Año</SelectItem>
            <SelectItem value="Rango Personalizado">Rango Personalizado</SelectItem>
          </>
        ) : (
          <>
            <SelectItem value="Este Mes">Este Mes</SelectItem>
            <SelectItem value="Último Trimestre">Último Trimestre</SelectItem>
            <SelectItem value="Este Año">Este Año</SelectItem>
            <SelectItem value="Año Anterior">Año Anterior</SelectItem>
            <SelectItem value="Comparación Interanual">Comparación Interanual</SelectItem>
          </>
        )}
      </SelectContent>
    </Select>
  );
}
