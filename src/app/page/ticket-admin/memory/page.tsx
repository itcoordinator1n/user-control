'use client';

import { useState } from 'react';
import { Search, User, Brain, Clock, BarChart2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemoryContext, useSearchMemory } from '@/hooks/useTicketQueries';

const TECH_LEVEL_LABEL: Record<string, string> = {
  basic: 'Básico',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

const COMM_STYLE_LABEL: Record<string, string> = {
  concise: 'Conciso',
  detailed: 'Detallado',
  needs_guidance: 'Necesita guía',
};

function MemoryInspector({ userId }: { userId: string }) {
  const { data, isLoading } = useMemoryContext(userId);
  const [searchQ, setSearchQ] = useState('');
  const { data: searchResult, isLoading: searching } = useSearchMemory(userId, searchQ);

  if (isLoading) return (
    <div className="space-y-3">
      <Skeleton className="h-32" />
      <Skeleton className="h-24" />
      <Skeleton className="h-40" />
    </div>
  );

  if (!data) return (
    <div className="text-center py-12 text-muted-foreground">
      <Brain className="mx-auto h-8 w-8 mb-2 opacity-40" />
      <p className="text-sm">No se encontró contexto de memoria para este usuario.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Profile */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="h-4 w-4" />
            Perfil del usuario
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="rounded-md bg-muted px-2 py-1 text-xs">
              <span className="text-muted-foreground">Nivel técnico: </span>
              <span className="font-medium">{TECH_LEVEL_LABEL[data.profile.technical_level] ?? data.profile.technical_level}</span>
            </div>
            <div className="rounded-md bg-muted px-2 py-1 text-xs">
              <span className="text-muted-foreground">Comunicación: </span>
              <span className="font-medium">{COMM_STYLE_LABEL[data.profile.communication_style] ?? data.profile.communication_style}</span>
            </div>
            <div className="rounded-md bg-muted px-2 py-1 text-xs">
              <span className="text-muted-foreground">Total tickets: </span>
              <span className="font-medium">{data.profile.total_tickets}</span>
            </div>
          </div>

          {data.profile.common_issues.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Problemas frecuentes</p>
              <div className="space-y-1">
                {data.profile.common_issues.slice(0, 5).map((issue, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span>{issue.category} / {issue.subcategory}</span>
                    <Badge variant="secondary">{issue.count}x</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Redis context */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Contexto activo (Redis)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-md bg-muted/50 p-3 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Turnos de conversación</span>
              <span className="font-mono">{data.redisContext.turn_count}</span>
            </div>
            {data.redisContext.ticket_id && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ticket activo</span>
                <span className="font-mono">{data.redisContext.ticket_id}</span>
              </div>
            )}
          </div>

          {data.redisContext.conversation_summary && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Resumen de conversación</p>
              <p className="text-xs leading-relaxed">{data.redisContext.conversation_summary}</p>
            </div>
          )}

          {data.redisContext.missing_fields.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Campos faltantes</p>
              <div className="flex flex-wrap gap-1">
                {data.redisContext.missing_fields.map((f) => (
                  <Badge key={f} variant="outline" className="text-[10px]">{f}</Badge>
                ))}
              </div>
            </div>
          )}

          {Object.keys(data.redisContext.extracted_fields).length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">Campos extraídos</p>
              <div className="rounded bg-muted/50 p-2 font-mono text-[11px] space-y-0.5 overflow-x-auto">
                {Object.entries(data.redisContext.extracted_fields).map(([k, v]) => (
                  <div key={k}>
                    <span className="text-purple-600">{k}</span>
                    <span className="text-muted-foreground">: </span>
                    <span>{JSON.stringify(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Segments */}
      {data.segments.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Segmentos de conversación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.segments.map((seg) => (
                <div key={seg.id} className="rounded-md border p-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{seg.topic}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(seg.last_msg_at).toLocaleDateString('es-SV', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{seg.summary}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Search className="h-4 w-4" />
            Buscar en memoria
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Buscar por keyword..."
          />
          {searching && <Skeleton className="h-16" />}
          {searchResult != null && (
            <pre className="text-xs rounded bg-muted p-3 overflow-x-auto max-h-48">
              {JSON.stringify(searchResult, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function MemoryPage() {
  const [userId, setUserId] = useState('');
  const [activeUserId, setActiveUserId] = useState('');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Inspector de memoria IA</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Visualizá el contexto que la IA tiene almacenado para cada usuario: perfil, conversaciones activas y campos extraídos.
        </p>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-2">
            <Input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="User ID (UUID del usuario)"
              onKeyDown={(e) => e.key === 'Enter' && setActiveUserId(userId)}
            />
            <Button onClick={() => setActiveUserId(userId)} disabled={!userId.trim()}>
              <BarChart2 className="mr-1.5 h-4 w-4" />
              Inspeccionar
            </Button>
          </div>
        </CardContent>
      </Card>

      {activeUserId && <MemoryInspector userId={activeUserId} />}

      {!activeUserId && (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <Brain className="mx-auto h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm">Ingresá un User ID para ver su contexto de memoria.</p>
        </div>
      )}
    </div>
  );
}
