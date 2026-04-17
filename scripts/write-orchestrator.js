/**
 * Escribe attendance-dashboard.tsx como orquestador limpio de ~180 líneas.
 * Ejecutar con: node scripts/write-orchestrator.js
 */
const fs = require("fs");
const path = require("path");

const DASH = path.join(__dirname, "../src/app/page/dashboard");
const src = path.join(DASH, "attendance-dashboard.tsx");
const lines = fs.readFileSync(src, "utf8").split("\n");

function clean(str) { return str.replace(/\r/g, ""); }

// Summary inner JSX (lines 2749–3647, 0-indexed 2748-3646) — inside the return()
const summaryInner = lines.slice(2748, 3647).map(clean).join("\n");

const orchestrator = `"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import { AttendanceView } from "./_components/attendance/attendance-view";
import { VacationView } from "./_components/vacations/vacation-view";
import PermissionsView from "./_components/permissions/permissions-view";
import { useDashboardPermissions } from "./_hooks/use-dashboard-permissions";
import type {
  AttendanceDataInterface,
  EmployeeProfile,
  VacationDataInterface,
  EmployeeVacationProfile,
  DashboardView,
} from "./_types/dashboard.types";

// UI imports needed for the summary view
import {
  ArrowLeft,
  Building2,
  Calendar,
  Download,
  Search,
  TrendingDown,
  TrendingUp,
  Users,
  Clock,
  Plane,
  FileText,
  UserCheck,
  CalendarDays,
  User,
  MapPin,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronUp,
  ChevronDown,
  Filter,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function AttendanceDashboard() {
  const { data: session } = useSession();
  const { canView, isAreaRestricted, userArea } = useDashboardPermissions();

  const [activeView, setActiveView] = useState<DashboardView | null>(null);

  // ─── Data state (fetched once, passed as props to sub-views) ───────────────
  const [cardsData, setCardsData] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceDataInterface[]>([]);
  const [employeeProfiles, setEmployeeProfiles] = useState<{ [key: string]: EmployeeProfile }>({});
  const [vacationData, setVacationData] = useState<VacationDataInterface[]>([]);
  const [employeeVacationProfiles, setEmployeeVacationProfiles] = useState<{ [key: string]: EmployeeVacationProfile }>({});
  const [monthlyData, setMonthlyData] = useState<any>(null);

  // Summary local UI state
  const [selectedArea, setSelectedArea] = useState(userArea ?? "Planta");
  const [selectedPeriod, setSelectedPeriod] = useState("Este Mes");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!session?.user?.accessToken) return;
    const token = session.user.accessToken;
    const headers = { "Content-Type": "application/json", Authorization: \`Bearer \${token}\` };

    fetch(\`\${process.env.NEXT_PUBLIC_API_URL}/api/requests/assistance-detail-resume\`, { headers })
      .then((r) => r.json())
      .then(setCardsData)
      .catch(console.error);

    fetch(\`\${process.env.NEXT_PUBLIC_API_URL}/api/permissions/get-vacation-stats\`, { headers })
      .then((r) => r.json())
      .then((data) => {
        setVacationData(data.stats);
        setEmployeeVacationProfiles(data.profiles);
      })
      .catch(console.error);

    fetch(\`\${process.env.NEXT_PUBLIC_API_URL}/api/requests/get-monthly-attendance\`, { headers })
      .then((r) => r.json())
      .then(setMonthlyData)
      .catch(console.error);

    fetch(\`\${process.env.NEXT_PUBLIC_API_URL}/api/attendance/attendance-history\`, { headers })
      .then((r) => r.json())
      .then((data) => {
        setAttendanceData(data.attendanceData);
        setEmployeeProfiles(data.byUser);
      })
      .catch(console.error);
  }, [session?.user?.accessToken]);

  // ─── Sub-view routing ────────────────────────────────────────────────────────
  if (activeView === "attendance") {
    return (
      <AttendanceView
        onBack={() => setActiveView(null)}
        attendanceData={attendanceData}
        employeeProfiles={employeeProfiles}
        monthlyData={monthlyData}
        allowedArea={isAreaRestricted ? userArea : null}
      />
    );
  }

  if (activeView === "vacations") {
    return (
      <VacationView
        onBack={() => setActiveView(null)}
        vacationData={vacationData}
        employeeVacationProfiles={employeeVacationProfiles}
        allowedArea={isAreaRestricted ? userArea : null}
      />
    );
  }

  if (activeView === "permissions") {
    return (
      <PermissionsView
        showPermissionDetail={true}
        setShowPermissionDetail={() => setActiveView(null)}
      />
    );
  }

  // ─── Summary (default view) ──────────────────────────────────────────────────
  return (
${summaryInner}
    </div>
  );
}
`;

const dest = path.join(DASH, "attendance-dashboard.tsx");
fs.writeFileSync(dest, orchestrator, "utf8");
console.log("✓ attendance-dashboard.tsx (orchestrator) written:", orchestrator.split("\n").length, "lines");
