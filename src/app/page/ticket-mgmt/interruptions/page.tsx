'use client';

import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useInterruptionAnalytics } from '@/hooks/useTicketQueries';

interface InterruptionData {
  summary: {
    total_interruptions: number;
    avg_duration_seconds: number;
    afk_percentage: number;
    most_common_reason: string;
  };
  by_reason: Array<{ reason: string; count: number; avg_duration_seconds: number }>;
  by_technician: Array<{ name: string; count: number; avg_focus_ratio: number }>;
  daily_trend: Array<{ date: string; interruptions: number; afk: number }>;
  worst_hours: Array<{ hour: number; count: number }>;
}

const REASON_LABELS: Record<string, string> = {
  colleague_question: 'Pregunta colega',
  urgent_ticket: 'Ticket urgente',
  meeting: 'Reunión',
  break_personal: 'Descanso',
  task_switch: 'Cambio de tarea',
  system_issue: 'Problema sistema',
  afk_detected: 'AFK detectado',
  other: 'Otro',
};

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308'];

function DateFilter({ from, to, onChange }: { from: string; to: string; onChange: (f: string, t: string) => void }) {
  const today = new Date();
  const presets = [
    { label: '7 días', days: 7 },
    { label: '30 días', days: 30 },
    { label: '90 días', days: 90 },
  ];
  return (
    <div className="flex gap-2">
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

export default function InterruptionsPage() {
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const [from, setFrom] = useState(thirtyDaysAgo);
  const [to, setTo] = useState(today);

  const { data: raw, isLoading } = useInterruptionAnalytics({ from, to });
  const data = raw as InterruptionData | undefined;

  const formatSeconds = (s: number) => {
    if (s < 60) return `${Math.round(s)}s`;
    return `${Math.round(s / 60)}m`;
  };

  const byReasonFormatted = (data?.by_reason ?? []).map((r) => ({
    ...r,
    label: REASON_LABELS[r.reason] ?? r.reason,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Análisis de interrupciones</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Impacto de las interrupciones en la productividad del equipo</p>
        </div>
        <DateFilter from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
      </div>

      {/* Summary cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : data?.summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{data.summary.total_interruptions}</p>
              <p className="text-xs text-muted-foreground">Total interrupciones</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{formatSeconds(data.summary.avg_duration_seconds)}</p>
              <p className="text-xs text-muted-foreground">Duración promedio</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-orange-500">{data.summary.afk_percentage.toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Son AFK</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-sm font-bold leading-tight">{REASON_LABELS[data.summary.most_common_reason] ?? data.summary.most_common_reason}</p>
              <p className="text-xs text-muted-foreground">Motivo más común</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily trend */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Tendencia diaria</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-56" /> : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data?.daily_trend ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line dataKey="interruptions" name="Interrupciones" stroke="#6366f1" strokeWidth={2} dot={false} />
                  <Line dataKey="afk" name="AFK" stroke="#f97316" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* By reason — pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Por motivo</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-52" /> : (
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={byReasonFormatted} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={80}>
                    {byReasonFormatted.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Avg duration by reason */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Duración promedio por motivo</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-52" /> : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={byReasonFormatted} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 60).toFixed(0)}m`} />
                  <YAxis dataKey="label" type="category" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip formatter={(v: number) => [formatSeconds(v), 'Duración']} />
                  <Bar dataKey="avg_duration_seconds" name="Duración" fill="#8b5cf6" radius={[0, 2, 2, 0]} />
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
            {isLoading ? <Skeleton className="h-52" /> : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={data?.by_technician ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Interrupciones" fill="#f43f5e" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Worst hours */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Peores horas del día</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-52" /> : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={data?.worst_hours ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="hour" tick={{ fontSize: 11 }} tickFormatter={(h) => `${h}:00`} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip labelFormatter={(h) => `${h}:00`} />
                  <Bar dataKey="count" name="Interrupciones" fill="#f97316" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
