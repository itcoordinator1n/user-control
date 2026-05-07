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

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Constants ────────────────────────────────────────────────────────────────

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
const TICK_SM = { fontSize: 11 };
const TICK_XS = { fontSize: 10 };
const R_TOP: [number, number, number, number] = [2, 2, 0, 0];
const EMPTY: never[] = [];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatHours(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return h + 'h ' + m + 'm';
  return m + 'm';
}

function yAxisHours(v: number) {
  return v + 'h';
}

function pieLabel(props: any) {
  if (!props) return '';
  return props.label + ' ' + (props.percent * 100).toFixed(0) + '%';
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
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
            <p className="text-xl font-bold mt-0.5">{props.value}</p>
          </div>
          <div className={`rounded-lg p-2 ${props.colorClass}`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TechStatsPage() {
  const { data: session } = useSession();
  const userId = (session?.user as unknown as { id?: string })?.id ?? '';

  const todayStr = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const [from, setFrom] = useState(thirtyDaysAgo);
  const [to, setTo] = useState(todayStr);

  const { data: raw, isLoading } = useTechnicianAnalytics(userId, { from, to });
  const stats = raw as TechStats | undefined;

  // Extract all data before JSX — prevents SWC _ref bug
  const summary = stats ? stats.summary : null;
  const daily = stats && stats.daily ? stats.daily : EMPTY;
  const byReason = stats && stats.by_interruption_reason ? stats.by_interruption_reason : EMPTY;
  const topCats = stats && stats.top_categories ? stats.top_categories : EMPTY;
  const weeklyTrend = stats && stats.weekly_trend ? stats.weekly_trend : EMPTY;
  const hasWeekly = weeklyTrend.length > 0;

  const dailyFormatted = daily.map(function(d) {
    return { date: d.date, focus_hours: +(d.focus_seconds / 3600).toFixed(2), tickets_resolved: d.tickets_resolved };
  });

  const byReasonFormatted = byReason.map(function(r) {
    return { count: r.count, label: REASON_LABELS[r.reason] || r.reason, reason: r.reason };
  });

  const topCatMax = topCats.length > 0 ? topCats[0].count : 1;

  const focusRatioLabel = summary ? String((summary.avg_focus_ratio * 100).toFixed(1)) + '%' : '0%';
  const focusTimeLabel = summary ? formatHours(summary.total_focus_seconds) : '0m';

  function handle7d() {
    setFrom(new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]);
    setTo(todayStr);
  }
  function handle30d() {
    setFrom(new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]);
    setTo(todayStr);
  }
  function handle90d() {
    setFrom(new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0]);
    setTo(todayStr);
  }

  const userName = session && session.user ? session.user.name : '';

  if (!userId) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        <p className="text-sm">Cargando sesión...</p>
      </div>
    );
  }

  const skeletons = [0, 1, 2, 3, 4, 5];

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Mi productividad</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {userName && <span className="font-medium">{userName} — </span>}
            Métricas personales de trabajo
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant={from === new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0] ? 'default' : 'outline'} onClick={handle7d}>7d</Button>
          <Button size="sm" variant={from === new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0] ? 'default' : 'outline'} onClick={handle30d}>30d</Button>
          <Button size="sm" variant={from === new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0] ? 'default' : 'outline'} onClick={handle90d}>90d</Button>
        </div>
      </div>

      {/* KPIs */}
      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {skeletons.map(function(i) { return <Skeleton key={i} className="h-24" />; })}
        </div>
      )}

      {!isLoading && summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KpiCard icon={Zap} label="Pomodoros" value={summary.pomodoros_completed} colorClass="bg-indigo-500" />
          <KpiCard icon={Clock} label="Tiempo foco" value={focusTimeLabel} colorClass="bg-blue-500" />
          <KpiCard icon={Target} label="Tickets resueltos" value={summary.total_tickets_resolved} colorClass="bg-green-600" />
          <KpiCard icon={TrendingUp} label="Sesiones" value={summary.total_sessions} colorClass="bg-purple-500" />
          <KpiCard icon={Zap} label="Ratio foco" value={focusRatioLabel} colorClass="bg-teal-500" />
          <KpiCard icon={Clock} label="Interrupciones" value={summary.total_interruptions} colorClass="bg-orange-500" />
        </div>
      )}

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
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={TICK_XS} />
                  <YAxis tick={TICK_SM} tickFormatter={yAxisHours} />
                  <Tooltip />
                  <Bar dataKey="focus_hours" name="Foco (h)" fill="#6366f1" radius={R_TOP} />
                  <Bar dataKey="tickets_resolved" name="Resueltos" fill="#22c55e" radius={R_TOP} />
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
                  <Pie
                    data={byReasonFormatted}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={pieLabel}
                    labelLine={false}
                  >
                    {byReasonFormatted.map(function(entry, i) {
                      return <Cell key={entry.reason} fill={COLORS[i % COLORS.length]} />;
                    })}
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
            {isLoading ? <Skeleton className="h-48" /> : topCats.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Sin datos disponibles.</p>
            ) : (
              <div className="space-y-2">
                {topCats.slice(0, 8).map(function(cat, i) {
                  const pct = String(Math.round((cat.count / topCatMax) * 100)) + '%';
                  return (
                    <div key={cat.category} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}.</span>
                      <div className="flex-1 h-5 rounded bg-muted overflow-hidden">
                        <div className="h-full rounded bg-indigo-500 transition-all" style={{ width: pct }} />
                      </div>
                      <span className="text-xs capitalize w-24 truncate">{cat.category}</span>
                      <Badge variant="secondary" className="text-[10px]">{cat.count}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly score trend */}
        {hasWeekly && (
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Tendencia semanal de productividad</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={weeklyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" tick={TICK_SM} />
                  <YAxis tick={TICK_SM} />
                  <Tooltip />
                  <Line dataKey="score" name="Score" stroke="#6366f1" strokeWidth={2} dot={true} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
