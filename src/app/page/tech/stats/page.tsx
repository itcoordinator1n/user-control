'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import { Clock, Zap, Target, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTechnicianAnalytics } from '@/hooks/useTicketQueries';

interface TechStats {
  summary: {
    total_sessions: number;
    total_focus_seconds: number;
    total_tickets_resolved: number;
    avg_focus_ratio: number;
    total_interruptions: number;
    pomodoros_completed: number;
  };
  daily: Array<{ date: string; focus_seconds: number; tickets_resolved: number; interruptions: number }>;
  by_interruption_reason: Array<{ reason: string; count: number }>;
  top_categories: Array<{ category: string; count: number }>;
  weekly_trend: Array<{ week: string; score: number }>;
}

const REASON_LABELS: Record<string, string> = {
  colleague_question: 'Colega',
  urgent_ticket: 'Ticket urgente',
  meeting: 'Reunión',
  break_personal: 'Descanso',
  task_switch: 'Cambio',
  system_issue: 'Sistema',
  afk_detected: 'AFK',
  other: 'Otro',
};

const COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308'];

function formatHours(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function KpiCard({ icon: Icon, label, value, colorClass }: {
  icon: React.ElementType; label: string; value: string | number; colorClass: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-bold mt-0.5">{value}</p>
          </div>
          <div className={`rounded-lg p-2 ${colorClass}`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const formatPieLabel = (props: any) => {
  if (!props) return '';
  return `${props.label} ${(props.percent * 100).toFixed(0)}%`;
};

const formatBarTooltip = (v: number, n: string) => {
  return n === 'focus_hours' ? [`${v}h`, 'Foco'] : [v, n];
};

const formatYAxisTick = (v: any) => {
  return `${v}h`;
};

export default function TechStatsPage() {
  const { data: session } = useSession();
  const userId = (session?.user as unknown as { id?: string })?.id ?? '';

  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const [from, setFrom] = useState(thirtyDaysAgo);
  const [to, setTo] = useState(today);

  const { data: raw, isLoading } = useTechnicianAnalytics(userId, { from, to });
  const stats = raw as TechStats | undefined;

  const presets = [
    { label: '7d', days: 7 },
    { label: '30d', days: 30 },
    { label: '90d', days: 90 },
  ];

  const byReasonFormatted = (stats?.by_interruption_reason ?? []).map((r) => ({
    ...r,
    label: REASON_LABELS[r.reason] ?? r.reason,
  }));

  const dailyFormatted = (stats?.daily ?? []).map((d) => ({
    ...d,
    focus_hours: +(d.focus_seconds / 3600).toFixed(2),
  }));

  if (!userId) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        <p className="text-sm">Cargando sesión...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Mi productividad</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {session?.user?.name && <span className="font-medium">{session.user.name} — </span>}
            Métricas personales de trabajo
          </p>
        </div>
        <div className="flex gap-2">
          {presets.map((preset) => {
            const { label, days } = preset;
            const f = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
            return (
              <Button
                key={days}
                size="sm"
                variant={from === f && to === today ? 'default' : 'outline'}
                onClick={() => { setFrom(f); setTo(today); }}
              >
                {label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* KPIs */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : stats?.summary ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard icon={Zap} label="Pomodoros" value={stats.summary.pomodoros_completed} colorClass="bg-indigo-500" />
          <KpiCard icon={Clock} label="Tiempo foco" value={formatHours(stats.summary.total_focus_seconds)} colorClass="bg-blue-500" />
          <KpiCard icon={Target} label="Tickets resueltos" value={stats.summary.total_tickets_resolved} colorClass="bg-green-600" />
          <KpiCard icon={TrendingUp} label="Sesiones" value={stats.summary.total_sessions} colorClass="bg-purple-500" />
          <KpiCard
            icon={Zap}
            label="Ratio foco"
            value={`${(stats.summary.avg_focus_ratio * 100).toFixed(1)}%`}
            colorClass="bg-teal-500"
          />
          <KpiCard icon={Clock} label="Interrupciones" value={stats.summary.total_interruptions} colorClass="bg-orange-500" />
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily focus */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Horas de foco por día</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-52" /> : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={dailyFormatted}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={formatYAxisTick} />
                  <Tooltip formatter={formatBarTooltip} />
                  <Bar dataKey="focus_hours" name="Foco" fill="#6366f1" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="tickets_resolved" name="Resueltos" fill="#22c55e" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Interruptions by reason */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Mis interrupciones por motivo</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-48" /> : byReasonFormatted.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Sin interrupciones registradas.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={byReasonFormatted} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={80}
                    label={formatPieLabel} labelLine={false}
                  >
                    {byReasonFormatted.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top categories */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Categorías que más resolví</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-48" /> : (stats?.top_categories ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Sin datos disponibles.</p>
            ) : (
              <div className="space-y-2">
                {(stats?.top_categories ?? []).slice(0, 8).map((cat, i) => (
                  <div key={cat.category} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}.</span>
                    <div className="flex-1 h-5 rounded bg-muted overflow-hidden">
                      <div
                        className="h-full rounded bg-indigo-500 transition-all"
                        style={{
                          width: `${(cat.count / ((stats?.top_categories?.[0]?.count ?? 1))) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs capitalize w-24 truncate">{cat.category}</span>
                    <Badge variant="secondary" className="text-[10px]">{cat.count}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly score trend */}
        {(stats?.weekly_trend ?? []).length > 0 && (
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tendencia semanal de productividad</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={stats?.weekly_trend ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line dataKey="score" name="Score" stroke="#6366f1" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
