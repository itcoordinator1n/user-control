"use client";

import { Building2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEFAULT_AREAS = ["Planta", "Administración", "Contabilidad", "Bodega"];

interface AreaFilterProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  includeAll?: boolean;
  /** When provided, renders these dynamic areas instead of the hardcoded defaults */
  areas?: string[];
}

export function AreaFilter({
  value,
  onChange,
  disabled = false,
  includeAll = true,
  areas,
}: AreaFilterProps) {
  const areaList = areas && areas.length > 0 ? areas : DEFAULT_AREAS;

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-48">
        <Building2 className="h-4 w-4 mr-2" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {includeAll && <SelectItem value="Todas">Todas las Áreas</SelectItem>}
        {areaList.map((a) => (
          <SelectItem key={a} value={a}>{a}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
