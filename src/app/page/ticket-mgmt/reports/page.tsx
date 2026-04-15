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

const STATUS_LABELS: Record<string, string> = {
  new: 'Nuevo', classified: 'Clasificado', assigned: 'Asignado',
  in_progress: 'En progreso', pending_user: 'Esperando usuario',
  resolved: 'Resuelto', closed: 'Cerrado', escalated: 'Escalado', reopened: 'Reabierto',
};

const PRIORITY_COLORS: Record<string, string> = { P1: 'destructive', P2: 'default', P3: 'secondary', P4: 'outline' };

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

  const techRows = (dash?.by_technician ?? []).filter((t) =>
    !searchTech || t.name.toLowerCase().includes(searchTech.toLowerCase())
  );

  const exportCSV = () => {
    if (!dash) return;
    const rows = [
      ['Técnico', 'Resueltos', 'Abiertos', 'Tiempo Promedio (h)'],
      ...(dash.by_technician ?? []).map((t) => [t.name, t.resolved, t.open, t.avg_resolution_hours?.toFixed(1) ?? 'N/A']),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-tickets-${from}-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
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
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Hasta</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Categoría</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {Object.keys(CATEGORY_TAXONOMY).map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
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
                  onChange={(e) => setSearchTech(e.target.value)}
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
                <BarChart data={dash?.daily_volume ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="created" name="Creados" fill="#6366f1" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="resolved" name="Resueltos" fill="#22c55e" radius={[2, 2, 0, 0]} />
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
                {(dash?.by_status ?? []).map((s) => (
                  <div key={s.status} className="flex items-center justify-between">
                    <span className="text-sm">{STATUS_LABELS[s.status] ?? s.status}</span>
                    <Badge variant="outline">{s.count}</Badge>
                  </div>
                ))}
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
                {(dash?.by_priority ?? []).map((p) => (
                  <div key={p.priority} className="flex items-center justify-between">
                    <Badge variant={(PRIORITY_COLORS[p.priority] as 'default' | 'secondary' | 'destructive' | 'outline') ?? 'outline'}>
                      {p.priority}
                    </Badge>
                    <span className="text-sm font-medium">{p.count} tickets</span>
                  </div>
                ))}
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
                    {techRows.map((t) => (
                      <tr key={t.name} className="border-b last:border-0">
                        <td className="py-2">{t.name}</td>
                        <td className="py-2 text-right text-green-600 font-medium">{t.resolved}</td>
                        <td className="py-2 text-right text-yellow-600 font-medium">{t.open}</td>
                        <td className="py-2 text-right text-muted-foreground">
                          {t.avg_resolution_hours != null ? `${t.avg_resolution_hours.toFixed(1)}h` : '—'}
                        </td>
                      </tr>
                    ))}
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
        {!loadingConv && conv && (
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Conversaciones del chatbot</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6 mb-4 flex-wrap">
                <div>
                  <p className="text-2xl font-bold">{conv.total_conversations}</p>
                  <p className="text-xs text-muted-foreground">Total conversaciones</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{conv.avg_turns?.toFixed(1) ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">Turnos promedio</p>
                </div>
                {(conv.channels ?? []).map((c) => (
                  <div key={c.channel}>
                    <p className="text-2xl font-bold">{c.count}</p>
                    <p className="text-xs text-muted-foreground capitalize">{c.channel}</p>
                  </div>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={conv.daily ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Conversaciones" fill="#a855f7" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
