'use client';

import { useState } from 'react';
import { Calendar, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGanttAnalytics } from '@/hooks/useTicketQueries';

interface GanttSession {
  session_id: string;
  ticket_id: string;
  ticket_code: string;
  technician_name: string;
  started_at: string;
  ended_at: string | null;
  actual_focus_seconds: number;
  was_completed: boolean;
  interruption_count: number;
}

interface GanttData {
  sessions: GanttSession[];
  technicians: string[];
  date_range: { from: string; to: string };
}

const PRIORITY_PALETTE = [
  'bg-indigo-400',
  'bg-purple-400',
  'bg-pink-400',
  'bg-blue-400',
  'bg-teal-400',
  'bg-amber-400',
  'bg-rose-400',
  'bg-cyan-400',
];

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function GanttRow({ techName, sessions, dayStart, dayEnd }: {
  techName: string;
  sessions: GanttSession[];
  dayStart: number; // ms
  dayEnd: number;   // ms
}) {
  const totalMs = dayEnd - dayStart;

  return (
    <div className="flex items-stretch border-b last:border-0 min-h-[2.5rem]">
      {/* Name col */}
      <div className="w-36 shrink-0 flex items-center px-2 border-r bg-muted/30">
        <span className="text-xs font-medium truncate">{techName}</span>
      </div>
      {/* Timeline */}
      <div className="relative flex-1 overflow-hidden">
        {sessions.map((s, i) => {
          const start = new Date(s.started_at).getTime();
          const end = s.ended_at ? new Date(s.ended_at).getTime() : Date.now();
          const left = Math.max(0, ((start - dayStart) / totalMs) * 100);
          const width = Math.min(100 - left, ((end - start) / totalMs) * 100);
          if (width <= 0) return null;
          return (
            <div
              key={s.session_id}
              className={`absolute top-1 bottom-1 rounded-sm flex items-center px-1.5 overflow-hidden cursor-default
                ${PRIORITY_PALETTE[i % PRIORITY_PALETTE.length]} ${!s.was_completed ? 'opacity-70 border border-dashed border-white/50' : ''}`}
              style={{ left: `${left}%`, width: `${width}%` }}
              title={`${s.ticket_code} — ${formatDuration(s.actual_focus_seconds)} foco${s.interruption_count > 0 ? ` — ${s.interruption_count} interrupciones` : ''}`}
            >
              <span className="text-[10px] text-white font-mono truncate leading-tight">
                {s.ticket_code}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function GanttPage() {
  const [days, setDays] = useState(7);
  const [techFilter, setTechFilter] = useState('');

  const { data: raw, isLoading } = useGanttAnalytics({ days });
  const data = raw as GanttData | undefined;

  const sessions = data?.sessions ?? [];
  const allTechs = data?.technicians ?? [];

  const filteredTechs = allTechs.filter((t) =>
    !techFilter || t.toLowerCase().includes(techFilter.toLowerCase())
  );

  // Timeline boundaries
  const now = Date.now();
  const rangeStart = now - days * 86400000;

  // Build hour labels
  const hourLabels: { label: string; pct: number }[] = [];
  const totalMs = now - rangeStart;
  const stepHours = days <= 2 ? 4 : days <= 7 ? 24 : 48;
  for (let t = rangeStart; t <= now; t += stepHours * 3600000) {
    const pct = ((t - rangeStart) / totalMs) * 100;
    const d = new Date(t);
    const label = days <= 7
      ? d.toLocaleDateString('es-SV', { weekday: 'short', day: '2-digit' })
      : d.toLocaleDateString('es-SV', { day: '2-digit', month: 'short' });
    hourLabels.push({ label, pct });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Diagrama de Gantt</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Sesiones de trabajo de cada técnico en el período</p>
        </div>
        <div className="flex gap-2">
          {[1, 3, 7, 14].map((d) => (
            <Button
              key={d}
              size="sm"
              variant={days === d ? 'default' : 'outline'}
              onClick={() => setDays(d)}
            >
              {d === 1 ? 'Hoy' : `${d}d`}
            </Button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-6 rounded bg-indigo-400" />
          <span>Sesión completada</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-6 rounded border border-dashed border-indigo-400 bg-indigo-400/50" />
          <span>Sesión incompleta / activa</span>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-end gap-3 max-w-xs">
        <div className="space-y-1.5 flex-1">
          <Label className="text-xs">Filtrar técnico</Label>
          <div className="relative">
            <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Nombre..."
              value={techFilter}
              onChange={(e) => setTechFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Gantt chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Línea de tiempo
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : filteredTechs.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              <Calendar className="mx-auto h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">Sin sesiones en el período seleccionado.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Hour axis */}
              <div className="flex border-b ml-36">
                <div className="relative flex-1 h-6">
                  {hourLabels.map(({ label, pct }, i) => (
                    <span
                      key={i}
                      className="absolute text-[10px] text-muted-foreground transform -translate-x-1/2"
                      style={{ left: `${pct}%`, top: '4px' }}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Rows */}
              {filteredTechs.map((tech) => (
                <GanttRow
                  key={tech}
                  techName={tech}
                  sessions={sessions.filter((s) => s.technician_name === tech)}
                  dayStart={rangeStart}
                  dayEnd={now}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session detail table */}
      {!isLoading && sessions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Detalle de sesiones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-2 font-medium text-muted-foreground">Técnico</th>
                    <th className="text-left pb-2 font-medium text-muted-foreground">Ticket</th>
                    <th className="text-left pb-2 font-medium text-muted-foreground">Inicio</th>
                    <th className="text-right pb-2 font-medium text-muted-foreground">Foco</th>
                    <th className="text-right pb-2 font-medium text-muted-foreground">Interr.</th>
                    <th className="text-right pb-2 font-medium text-muted-foreground">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions
                    .filter((s) => !techFilter || s.technician_name.toLowerCase().includes(techFilter.toLowerCase()))
                    .slice(0, 30)
                    .map((s) => (
                      <tr key={s.session_id} className="border-b last:border-0">
                        <td className="py-1.5">{s.technician_name}</td>
                        <td className="py-1.5 font-mono">{s.ticket_code}</td>
                        <td className="py-1.5 text-muted-foreground">
                          {new Date(s.started_at).toLocaleString('es-SV', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-1.5 text-right">{formatDuration(s.actual_focus_seconds)}</td>
                        <td className="py-1.5 text-right">{s.interruption_count}</td>
                        <td className="py-1.5 text-right">
                          <Badge variant={s.was_completed ? 'default' : 'secondary'} className="text-[10px]">
                            {s.was_completed ? 'Completo' : 'Incompleto'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
