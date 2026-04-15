'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, TrendingUp, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useShadowRules, useApproveShadowRule, useDismissShadowRule } from '@/hooks/useTicketQueries';
import type { ShadowRule } from '@/lib/ticket-api';

function AccuracyBar({ value }: { value: number }) {
  const color = value >= 85 ? 'bg-green-500' : value >= 70 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-mono w-10 text-right">{value.toFixed(1)}%</span>
    </div>
  );
}

function RuleCard({ rule }: { rule: ShadowRule }) {
  const { mutate: approve, isPending: approving } = useApproveShadowRule();
  const { mutate: dismiss, isPending: dismissing } = useDismissShadowRule();
  const isPending = rule.status === 'pending';

  return (
    <Card className={!isPending ? 'opacity-60' : ''}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Brain className="h-4 w-4 text-purple-500 shrink-0" />
            <span className="text-sm font-medium truncate">{rule.condition}</span>
          </div>
          <Badge
            variant={rule.status === 'approved' ? 'default' : rule.status === 'dismissed' ? 'secondary' : 'outline'}
            className="shrink-0"
          >
            {rule.status === 'approved' ? 'Aprobada' : rule.status === 'dismissed' ? 'Descartada' : 'Pendiente'}
          </Badge>
        </div>

        {/* Prediction */}
        <div className="rounded-md bg-muted/50 px-3 py-2 text-xs space-y-0.5">
          <span className="text-muted-foreground">Predice →</span>
          <p className="font-semibold text-foreground">
            {rule.predicted_category} / {rule.predicted_subcategory}
          </p>
        </div>

        {/* Stats */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Precisión ({rule.correct_observations}/{rule.total_observations} casos)</span>
            <TrendingUp className="h-3.5 w-3.5" />
          </div>
          <AccuracyBar value={rule.accuracy_percent} />
        </div>

        {/* Actions */}
        {isPending && (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-green-700 border-green-300 hover:bg-green-50"
              disabled={approving || dismissing}
              onClick={() => approve(rule.id)}
            >
              <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
              Aprobar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-red-700 border-red-300 hover:bg-red-50"
              disabled={approving || dismissing}
              onClick={() => dismiss(rule.id)}
            >
              <XCircle className="mr-1.5 h-3.5 w-3.5" />
              Descartar
            </Button>
          </div>
        )}

        <p className="text-[11px] text-muted-foreground">
          Creada {new Date(rule.created_at).toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      </CardContent>
    </Card>
  );
}

export default function ShadowPage() {
  const { data, isLoading } = useShadowRules();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'dismissed'>('all');

  const rules = data?.rules ?? [];
  const filtered = filter === 'all' ? rules : rules.filter((r) => r.status === filter);

  const counts = {
    pending: rules.filter((r) => r.status === 'pending').length,
    approved: rules.filter((r) => r.status === 'approved').length,
    dismissed: rules.filter((r) => r.status === 'dismissed').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">Reglas candidatas (Shadow Mode)</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Reglas generadas por el modelo de IA en modo sombra. Aprobá las que son precisas para incorporarlas al árbol de decisión.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-orange-500">{counts.pending}</p>
            <p className="text-xs text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{counts.approved}</p>
            <p className="text-xs text-muted-foreground">Aprobadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-muted-foreground">{counts.dismissed}</p>
            <p className="text-xs text-muted-foreground">Descartadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'pending', 'approved', 'dismissed'] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={filter === f ? 'default' : 'outline'}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendientes' : f === 'approved' ? 'Aprobadas' : 'Descartadas'}
          </Button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
          <Brain className="mx-auto h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm">No hay reglas {filter !== 'all' ? `con estado "${filter}"` : ''}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((rule) => (
            <RuleCard key={rule.id} rule={rule} />
          ))}
        </div>
      )}
    </div>
  );
}
