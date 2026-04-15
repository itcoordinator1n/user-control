'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Plus, Shield, Box, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  usePlatforms,
  useCreatePlatform,
  usePermissions,
  useAuthorizationRequests,
  useReviewAuthRequest,
} from '@/hooks/useTicketQueries';
import type { Platform } from '@/lib/ticket-api';

// ─── Platforms tab ────────────────────────────────────────────────────────────

function NewPlatformDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { mutate: create, isPending } = useCreatePlatform();
  const [form, setForm] = useState<Omit<Platform, 'id'>>({
    name: '', code: '', url: null, it_owner_id: null, status: 'active', notes: null,
  });

  const handleSubmit = () => {
    create(form, { onSuccess: onClose });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Nueva plataforma</DialogTitle></DialogHeader>
        <div className="space-y-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="SAP ERP" />
            </div>
            <div className="space-y-1.5">
              <Label>Código</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="SAP" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>URL (opcional)</Label>
            <Input value={form.url ?? ''} onChange={(e) => setForm({ ...form, url: e.target.value || null })} placeholder="https://..." />
          </div>
          <div className="space-y-1.5">
            <Label>Notas</Label>
            <Textarea value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value || null })} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!form.name || !form.code || isPending}>Crear</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PlatformsTab() {
  const { data: platforms, isLoading } = usePlatforms();
  const { data: permissions } = usePermissions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(null);

  const filteredPerms = selectedPlatformId
    ? (permissions ?? []).filter((p) => p.platform_id === selectedPlatformId)
    : (permissions ?? []);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Nueva plataforma
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(platforms ?? []).map((p) => (
            <Card
              key={p.id}
              className={`cursor-pointer transition-colors ${selectedPlatformId === p.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedPlatformId(selectedPlatformId === p.id ? null : p.id)}
            >
              <CardContent className="p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">{p.name}</span>
                  <Badge variant={p.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                    {p.status === 'active' ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
                <span className="text-xs font-mono text-muted-foreground">{p.code}</span>
                {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline truncate block">{p.url}</a>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Permissions for selected platform */}
      {filteredPerms.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              Permisos {selectedPlatformId ? `de "${platforms?.find(p => p.id === selectedPlatformId)?.name}"` : 'globales'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {filteredPerms.map((perm) => (
                <div key={perm.id} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50">
                  <div>
                    <span className="text-sm font-medium">{perm.name}</span>
                    <span className="ml-2 font-mono text-xs text-muted-foreground">{perm.code}</span>
                  </div>
                  {perm.description && (
                    <span className="text-xs text-muted-foreground hidden sm:block">{perm.description}</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {dialogOpen && <NewPlatformDialog open onClose={() => setDialogOpen(false)} />}
    </div>
  );
}

// ─── Auth requests tab ────────────────────────────────────────────────────────

function AuthRequestsTab() {
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const { data: requests, isLoading } = useAuthorizationRequests(statusFilter);
  const { mutate: review, isPending: reviewing } = useReviewAuthRequest();
  const [reviewTarget, setReviewTarget] = useState<{ id: string; action: 'approved' | 'rejected' } | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const handleReview = () => {
    if (!reviewTarget) return;
    review(
      { id: reviewTarget.id, status: reviewTarget.action, review_notes: reviewNotes },
      {
        onSuccess: () => {
          setReviewTarget(null);
          setReviewNotes('');
        },
      }
    );
  };

  const STATUS_LABELS: Record<string, string> = {
    pending: 'Pendientes',
    approved: 'Aprobadas',
    rejected: 'Rechazadas',
    executed: 'Ejecutadas',
  };

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(STATUS_LABELS).map(([s, label]) => (
          <Button
            key={s}
            size="sm"
            variant={statusFilter === s ? 'default' : 'outline'}
            onClick={() => setStatusFilter(s)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : (requests ?? []).length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
          <ClipboardList className="mx-auto h-7 w-7 mb-2 opacity-40" />
          <p className="text-sm">No hay solicitudes con estado "{STATUS_LABELS[statusFilter]}".</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(requests ?? []).map((req) => (
            <Card key={req.id}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{req.type}</p>
                    <p className="text-xs text-muted-foreground">{req.beneficiary_name ?? req.beneficiary_id}</p>
                  </div>
                  <Badge
                    variant={
                      req.status === 'approved' ? 'default'
                      : req.status === 'rejected' ? 'destructive'
                      : 'outline'
                    }
                    className="shrink-0"
                  >
                    {STATUS_LABELS[req.status] ?? req.status}
                  </Badge>
                </div>
                <p className="text-xs">{req.description}</p>
                {req.review_notes && (
                  <p className="text-xs text-muted-foreground italic">Notas: {req.review_notes}</p>
                )}
                <p className="text-[11px] text-muted-foreground">
                  {new Date(req.created_at).toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>

                {req.status === 'pending' && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-green-700 border-green-300"
                      onClick={() => setReviewTarget({ id: req.id, action: 'approved' })}
                    >
                      <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                      Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-red-700 border-red-300"
                      onClick={() => setReviewTarget({ id: req.id, action: 'rejected' })}
                    >
                      <XCircle className="mr-1.5 h-3.5 w-3.5" />
                      Rechazar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review dialog */}
      <Dialog open={!!reviewTarget} onOpenChange={() => setReviewTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewTarget?.action === 'approved' ? 'Aprobar solicitud' : 'Rechazar solicitud'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Notas de revisión (opcional)</Label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={3}
                placeholder="Motivo de la decisión..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReviewTarget(null)}>Cancelar</Button>
            <Button
              onClick={handleReview}
              disabled={reviewing}
              variant={reviewTarget?.action === 'rejected' ? 'destructive' : 'default'}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TicketUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Plataformas, permisos y autorizaciones</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gestioná las plataformas registradas, sus permisos y las solicitudes de autorización pendientes.
        </p>
      </div>

      <Tabs defaultValue="platforms">
        <TabsList>
          <TabsTrigger value="platforms">
            <Box className="mr-1.5 h-4 w-4" />
            Plataformas
          </TabsTrigger>
          <TabsTrigger value="permissions">
            <Shield className="mr-1.5 h-4 w-4" />
            Autorizaciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="platforms" className="mt-4">
          <PlatformsTab />
        </TabsContent>

        <TabsContent value="permissions" className="mt-4">
          <AuthRequestsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
