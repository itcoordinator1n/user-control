'use client';

import { useState } from 'react';
import { Download, Filter, Search } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDashboardAnalytics, useConversationAnalytics } from '@/hooks/useTicketQueries';
import { CATEGORY_TAXONOMY } from '@/types/tickets';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardData {
  summary: { total_tickets: number; resolved_today: number; avg_resolution_hours: number; open_tickets: number; escalated_count: number };
  by_status: Array<{ status: string; count: number }>;
  by_priority: Array<{ priority: string; count: number }>;
  by_category: Array<{ category: string; count: number }>;
  by_technician: Array<{ name: string; resolved: number; open: number; avg_resolution_hours: number }>;
  daily_volume: Array<{ date: string; created: number; resolved: number }>;
}

interface ConvData {
  total_conversations: number;
  avg_turns: number;
  channels: Array<{ channel: string; count: number }>;
  daily: Array<{ date: string; count: number }>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  new: 'Nuevo', classified: 'Clasificado', assigned: 'Asignado',
  in_progress: 'En progreso', pending_user: 'Esperando usuario',
  resolved: 'Resuelto', closed: 'Cerrado', escalated: 'Escalado', reopened: 'Reabierto',
};

const PRIORITY_BADGE: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  P1: 'destructive', P2: 'default', P3: 'secondary', P4: 'outline',
};

const TICK_SM = { fontSize: 11 };
const TICK_XS = { fontSize: 10 };
const R_TOP: [number, number, number, number] = [2, 2, 0, 0];
const EMPTY: never[] = [];
const CATEGORY_KEYS = Object.keys(CATEGORY_TAXONOMY);

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

  const [from, setFrom] = useState(thirtyDaysAgo);
  const [to, setTo] = useState(today);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchTech, setSearchTech] = useState('');

  const { data: rawDash, isLoading } = useDashboardAnalytics({ from, to });
  const { data: rawConv, isLoading: loadingConv } = useConversationAnalytics({ from, to });
  const dash = rawDash as DashboardData | undefined;
  const conv = rawConv as ConvData | undefined;

  // Extract all data before JSX — prevents SWC _ref bug with Recharts
  const dailyVolume = dash && dash.daily_volume ? dash.daily_volume : EMPTY;
  const byStatus = dash && dash.by_status ? dash.by_status : EMPTY;
  const byPriority = dash && dash.by_priority ? dash.by_priority : EMPTY;
  const byTech = dash && dash.by_technician ? dash.by_technician : EMPTY;
  const convDaily = conv && conv.daily ? conv.daily : EMPTY;
  const convChannels = conv && conv.channels ? conv.channels : EMPTY;
  const convTotal = conv ? conv.total_conversations : 0;
  const convAvgTurns = conv && conv.avg_turns != null ? String(conv.avg_turns.toFixed(1)) : '—';
  const hasConv = !loadingConv && conv != null;

  const techRows = byTech.filter(function(t) {
    if (!searchTech) return true;
    return t.name.toLowerCase().includes(searchTech.toLowerCase());
  });

  function handleFromChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFrom(e.target.value);
  }

  function handleToChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTo(e.target.value);
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchTech(e.target.value);
  }

  function exportCSV() {
    if (!dash) return;
    const rows = [
      ['Técnico', 'Resueltos', 'Abiertos', 'Tiempo Promedio (h)'],
      ...byTech.map(function(t) {
        const avg = t.avg_resolution_hours != null ? t.avg_resolution_hours.toFixed(1) : 'N/A';
        return [t.name, String(t.resolved), String(t.open), avg];
      }),
    ];
    const csv = rows.map(function(r) { return r.join(','); }).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reporte-tickets-' + from + '-' + to + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Reportes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Datos detallados del período seleccionado</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV} disabled={!dash}>
          <Download className="mr-1.5 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Desde</Label>
              <Input type="date" value={from} onChange={handleFromChange} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Hasta</Label>
              <Input type="date" value={to} onChange={handleToChange} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Categoría</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {CATEGORY_KEYS.map(function(cat) {
                    return <SelectItem key={cat} value={cat}>{cat}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Buscar técnico</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  className="pl-8"
                  placeholder="Nombre..."
                  value={searchTech}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Volume chart */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Volumen de tickets por día</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-48" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dailyVolume}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={TICK_XS} />
                  <YAxis tick={TICK_SM} />
                  <Tooltip />
                  <Bar dataKey="created" name="Creados" fill="#6366f1" radius={R_TOP} />
                  <Bar dataKey="resolved" name="Resueltos" fill="#22c55e" radius={R_TOP} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Status breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Distribución por estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-48" /> : (
              <div className="space-y-2">
                {byStatus.map(function(s) {
                  const label = STATUS_LABELS[s.status] || s.status;
                  return (
                    <div key={s.status} className="flex items-center justify-between">
                      <span className="text-sm">{label}</span>
                      <Badge variant="outline">{s.count}</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Priority breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distribución por prioridad</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-48" /> : (
              <div className="space-y-2">
                {byPriority.map(function(p) {
                  const variant = PRIORITY_BADGE[p.priority] || 'outline';
                  return (
                    <div key={p.priority} className="flex items-center justify-between">
                      <Badge variant={variant}>{p.priority}</Badge>
                      <span className="text-sm font-medium">{p.count} tickets</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Technician table */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Rendimiento por técnico</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-40" /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-2 font-medium text-muted-foreground">Técnico</th>
                      <th className="pb-2 font-medium text-muted-foreground text-right">Resueltos</th>
                      <th className="pb-2 font-medium text-muted-foreground text-right">Abiertos</th>
                      <th className="pb-2 font-medium text-muted-foreground text-right">T. Promedio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {techRows.map(function(t) {
                      const avg = t.avg_resolution_hours != null
                        ? String(t.avg_resolution_hours.toFixed(1)) + 'h'
                        : '—';
                      return (
                        <tr key={t.name} className="border-b last:border-0">
                          <td className="py-2">{t.name}</td>
                          <td className="py-2 text-right text-green-600 font-medium">{t.resolved}</td>
                          <td className="py-2 text-right text-yellow-600 font-medium">{t.open}</td>
                          <td className="py-2 text-right text-muted-foreground">{avg}</td>
                        </tr>
                      );
                    })}
                    {techRows.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-muted-foreground text-xs">
                          Sin datos para los filtros seleccionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversations */}
        {hasConv && (
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Conversaciones del chatbot</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6 mb-4 flex-wrap">
                <div>
                  <p className="text-2xl font-bold">{convTotal}</p>
                  <p className="text-xs text-muted-foreground">Total conversaciones</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{convAvgTurns}</p>
                  <p className="text-xs text-muted-foreground">Turnos promedio</p>
                </div>
                {convChannels.map(function(c) {
                  return (
                    <div key={c.channel}>
                      <p className="text-2xl font-bold">{c.count}</p>
                      <p className="text-xs text-muted-foreground capitalize">{c.channel}</p>
                    </div>
                  );
                })}
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={convDaily}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={TICK_XS} />
                  <YAxis tick={TICK_SM} />
                  <Tooltip />
                  <Bar dataKey="count" name="Conversaciones" fill="#a855f7" radius={R_TOP} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
