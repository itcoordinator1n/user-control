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

// ─── Types (shape returned by backend) ───────────────────────────────────────

interface DashboardData {
  summary: {
    total_tickets: number;
    resolved_today: number;
    avg_resolution_hours: number;
    open_tickets: number;
    escalated_count: number;
    satisfaction_avg: number | null;
  };
  by_status: Array<{ status: string; count: number }>;
  by_priority: Array<{ priority: string; count: number }>;
  by_category: Array<{ category: string; count: number }>;
  by_technician: Array<{ name: string; resolved: number; open: number }>;
  daily_volume: Array<{ date: string; created: number; resolved: number }>;
}

const PRIORITY_COLORS: Record<string, string> = {
  P1: '#ef4444',
  P2: '#f97316',
  P3: '#eab308',
  P4: '#22c55e',
};

const STATUS_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  colorClass,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  colorClass: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className={`rounded-lg p-2 ${colorClass}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DateFilter({ from, to, onChange }: {
  from: string; to: string;
  onChange: (from: string, to: string) => void;
}) {
  const presets = [
    { label: '7 días', days: 7 },
    { label: '30 días', days: 30 },
    { label: '90 días', days: 90 },
  ];
  const today = new Date();
  return (
    <div className="flex gap-2 flex-wrap">
      {presets.map(({ label, days }) => {
        const f = new Date(today);
        f.setDate(f.getDate() - days);
        const fStr = f.toISOString().split('T')[0];
        const tStr = today.toISOString().split('T')[0];
        return (
          <Button
            key={days}
            size="sm"
            variant={from === fStr && to === tStr ? 'default' : 'outline'}
            onClick={() => onChange(fStr, tStr)}
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}

export default function TicketMgmtPage() {
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const [from, setFrom] = useState(thirtyDaysAgo);
  const [to, setTo] = useState(today);

  const { data: raw, isLoading } = useDashboardAnalytics({ from, to });
  const data = raw as DashboardData | undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Dashboard de gerencia</h1>
          <p className="text-sm text-muted-foreground mt-0.5">KPIs consolidados del sistema de tickets IT</p>
        </div>
        <DateFilter from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
      </div>

      {/* KPI cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
        </div>
      ) : data?.summary ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard icon={BarChart2} label="Total tickets" value={data.summary.total_tickets} colorClass="bg-indigo-500" />
          <KpiCard icon={CheckCircle} label="Resueltos hoy" value={data.summary.resolved_today} colorClass="bg-green-600" />
          <KpiCard icon={Clock} label="Tiempo promedio" value={`${data.summary.avg_resolution_hours.toFixed(1)}h`} sub="resolución" colorClass="bg-blue-500" />
          <KpiCard icon={TrendingUp} label="Abiertos" value={data.summary.open_tickets} colorClass="bg-yellow-500" />
          <KpiCard icon={AlertTriangle} label="Escalados" value={data.summary.escalated_count} colorClass="bg-red-500" />
          <KpiCard
            icon={Users}
            label="Satisfacción"
            value={data.summary.satisfaction_avg != null ? `${data.summary.satisfaction_avg.toFixed(1)}/5` : 'N/A'}
            colorClass="bg-purple-500"
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily volume */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Volumen diario</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-56" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data?.daily_volume ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="created" name="Creados" fill="#6366f1" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="resolved" name="Resueltos" fill="#22c55e" radius={[2, 2, 0, 0]} />
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
            {isLoading ? (
              <Skeleton className="h-48" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={data?.by_status ?? []}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {(data?.by_status ?? []).map((_, i) => (
                      <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />
                    ))}
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
            {isLoading ? (
              <Skeleton className="h-48" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data?.by_priority ?? []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="priority" type="category" tick={{ fontSize: 11 }} width={30} />
                  <Tooltip />
                  <Bar dataKey="count" name="Tickets" radius={[0, 2, 2, 0]}>
                    {(data?.by_priority ?? []).map((entry, i) => (
                      <Cell key={i} fill={PRIORITY_COLORS[entry.priority] ?? '#6366f1'} />
                    ))}
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
            {isLoading ? (
              <Skeleton className="h-48" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data?.by_category ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="category" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[2, 2, 0, 0]} />
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
            {isLoading ? (
              <Skeleton className="h-48" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data?.by_technician ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="resolved" name="Resueltos" fill="#22c55e" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="open" name="Abiertos" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
