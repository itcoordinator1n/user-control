'use client';

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { TrendingUp, Clock, CheckCircle, AlertTriangle, Users, BarChart2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useDashboardAnalytics } from '@/hooks/useTicketQueries';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SummaryShape {
  total_tickets: number;
  resolved_today: number;
  avg_resolution_hours: number;
  open_tickets: number;
  escalated_count: number;
  satisfaction_avg: number | null;
}

interface DashboardData {
  summary: SummaryShape;
  by_status: Array<{ status: string; count: number }>;
  by_priority: Array<{ priority: string; count: number }>;
  by_category: Array<{ category: string; count: number }>;
  by_technician: Array<{ name: string; resolved: number; open: number }>;
  daily_volume: Array<{ date: string; created: number; resolved: number }>;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PRIORITY_COLORS: Record<string, string> = {
  P1: '#ef4444',
  P2: '#f97316',
  P3: '#eab308',
  P4: '#22c55e',
};

const STATUS_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];
const TICK_SM = { fontSize: 11 };
const TICK_XS = { fontSize: 10 };
const R_TOP: [number, number, number, number] = [2, 2, 0, 0];
const R_RIGHT: [number, number, number, number] = [0, 2, 2, 0];
const EMPTY: never[] = [];

// ─── Sub-components ──────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  colorClass: string;
}

function KpiCard(props: KpiCardProps) {
  const Icon = props.icon;
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{props.label}</p>
            <p className="text-2xl font-bold mt-1">{props.value}</p>
            {props.sub && <p className="text-xs text-muted-foreground mt-0.5">{props.sub}</p>}
          </div>
          <div className={`rounded-lg p-2 ${props.colorClass}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface DateFilterProps {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}

function buildPreset(days: number) {
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - days);
  return {
    fStr: from.toISOString().split('T')[0],
    tStr: today.toISOString().split('T')[0],
  };
}

function DateFilter(props: DateFilterProps) {
  const preset7 = buildPreset(7);
  const preset30 = buildPreset(30);
  const preset90 = buildPreset(90);

  function handle7() { props.onChange(preset7.fStr, preset7.tStr); }
  function handle30() { props.onChange(preset30.fStr, preset30.tStr); }
  function handle90() { props.onChange(preset90.fStr, preset90.tStr); }

  const active7 = props.from === preset7.fStr && props.to === preset7.tStr;
  const active30 = props.from === preset30.fStr && props.to === preset30.tStr;
  const active90 = props.from === preset90.fStr && props.to === preset90.tStr;

  return (
    <div className="flex gap-2 flex-wrap">
      <Button size="sm" variant={active7 ? 'default' : 'outline'} onClick={handle7}>7 días</Button>
      <Button size="sm" variant={active30 ? 'default' : 'outline'} onClick={handle30}>30 días</Button>
      <Button size="sm" variant={active90 ? 'default' : 'outline'} onClick={handle90}>90 días</Button>
    </div>
  );
}

function formatPieLabel(entry: any) {
  if (!entry) return '';
  return String((entry.percent * 100).toFixed(0)) + '%';
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TicketMgmtPage() {
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const [from, setFrom] = useState(thirtyDaysAgo);
  const [to, setTo] = useState(today);

  const { data: raw, isLoading } = useDashboardAnalytics({ from, to });
  const data = raw as DashboardData | undefined;

  // Extract all data before JSX — prevents SWC _ref bug with Recharts
  const summary = data ? data.summary : null;
  const dailyVolume = data && data.daily_volume ? data.daily_volume : EMPTY;
  const byStatus = data && data.by_status ? data.by_status : EMPTY;
  const byPriority = data && data.by_priority ? data.by_priority : EMPTY;
  const byCategory = data && data.by_category ? data.by_category : EMPTY;
  const byTechnician = data && data.by_technician ? data.by_technician : EMPTY;

  const satisfactionLabel = summary && summary.satisfaction_avg != null
    ? String(summary.satisfaction_avg.toFixed(1)) + '/5'
    : 'N/A';
  const avgResolutionLabel = summary
    ? String(summary.avg_resolution_hours.toFixed(1)) + 'h'
    : '0h';

  function handleDateChange(f: string, t: string) {
    setFrom(f);
    setTo(t);
  }

  const skeletons = [0, 1, 2, 3, 4, 5];

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Dashboard de gerencia</h1>
          <p className="text-sm text-muted-foreground mt-0.5">KPIs consolidados del sistema de tickets IT</p>
        </div>
        <DateFilter from={from} to={to} onChange={handleDateChange} />
      </div>

      {/* KPI cards */}
      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {skeletons.map(function(i) {
            return <Skeleton key={i} className="h-28" />;
          })}
        </div>
      )}

      {!isLoading && summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard icon={BarChart2} label="Total tickets" value={summary.total_tickets} colorClass="bg-indigo-500" />
          <KpiCard icon={CheckCircle} label="Resueltos hoy" value={summary.resolved_today} colorClass="bg-green-600" />
          <KpiCard icon={Clock} label="Tiempo promedio" value={avgResolutionLabel} sub="resolución" colorClass="bg-blue-500" />
          <KpiCard icon={TrendingUp} label="Abiertos" value={summary.open_tickets} colorClass="bg-yellow-500" />
          <KpiCard icon={AlertTriangle} label="Escalados" value={summary.escalated_count} colorClass="bg-red-500" />
          <KpiCard icon={Users} label="Satisfacción" value={satisfactionLabel} colorClass="bg-purple-500" />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily volume */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Volumen diario</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-56" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={dailyVolume}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={TICK_SM} />
                  <YAxis tick={TICK_SM} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="created" name="Creados" fill="#6366f1" radius={R_TOP} />
                  <Bar dataKey="resolved" name="Resueltos" fill="#22c55e" radius={R_TOP} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* By status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Por estado</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-48" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={byStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={formatPieLabel}
                    labelLine={false}
                  >
                    {byStatus.map(function(entry, i) {
                      const fill = STATUS_COLORS[i % STATUS_COLORS.length];
                      return <Cell key={entry.status} fill={fill} />;
                    })}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* By priority */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Por prioridad</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-48" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byPriority} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={TICK_SM} />
                  <YAxis dataKey="priority" type="category" tick={TICK_SM} width={30} />
                  <Tooltip />
                  <Bar dataKey="count" name="Tickets" radius={R_RIGHT}>
                    {byPriority.map(function(entry, i) {
                      const fill = PRIORITY_COLORS[entry.priority] || '#6366f1';
                      return <Cell key={i} fill={fill} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* By category */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Por categoría</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-48" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byCategory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" tick={TICK_XS} />
                  <YAxis tick={TICK_SM} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={R_TOP} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* By technician */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Por técnico</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-48" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={byTechnician}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={TICK_XS} />
                  <YAxis tick={TICK_SM} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="resolved" name="Resueltos" fill="#22c55e" radius={R_TOP} />
                  <Bar dataKey="open" name="Abiertos" fill="#f59e0b" radius={R_TOP} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
