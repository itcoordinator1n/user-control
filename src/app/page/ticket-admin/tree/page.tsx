'use client';

import { useState } from 'react';
import { Plus, Trash2, Rocket, ChevronRight, Leaf, GitBranch, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  useTree,
  useTreeVersions,
  useCreateTreeNode,
  useUpdateTreeNode,
  useDeleteTreeNode,
  useDeployTree,
} from '@/hooks/useTicketQueries';
import type { TreeNode } from '@/lib/ticket-api';

// ─── Node form dialog ─────────────────────────────────────────────────────────

interface NodeFormProps {
  open: boolean;
  initial?: Partial<TreeNode>;
  parentId?: string | null;
  onClose: () => void;
}

function NodeFormDialog({ open, initial, parentId, onClose }: NodeFormProps) {
  const { mutate: create, isPending: creating } = useCreateTreeNode();
  const { mutate: update, isPending: updating } = useUpdateTreeNode();
  const isEdit = !!initial?.id;

  const [question, setQuestion] = useState(initial?.question ?? '');
  const [options, setOptions] = useState((initial?.answer_options ?? ['']).join('\n'));
  const [isLeaf, setIsLeaf] = useState(initial?.is_leaf ?? false);
  const [resultCategory, setResultCategory] = useState(initial?.result_category ?? '');
  const [resultSubcategory, setResultSubcategory] = useState(initial?.result_subcategory ?? '');

  const handleSubmit = () => {
    const answer_options = options.split('\n').map((s) => s.trim()).filter(Boolean);
    const payload: Partial<TreeNode> = {
      question,
      answer_options,
      is_leaf: isLeaf,
      result_category: isLeaf ? resultCategory : null,
      result_subcategory: isLeaf ? resultSubcategory : null,
      parent_id: parentId ?? null,
    };
    if (isEdit) {
      update({ id: initial!.id!, ...payload }, { onSuccess: onClose });
    } else {
      create(payload, { onSuccess: onClose });
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar nodo' : 'Nuevo nodo'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Pregunta / texto del nodo</Label>
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={3}
              placeholder="¿El problema es de hardware o software?"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Opciones de respuesta (una por línea)</Label>
            <Textarea
              value={options}
              onChange={(e) => setOptions(e.target.value)}
              rows={4}
              placeholder={"Hardware\nSoftware\nRed"}
            />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={isLeaf} onCheckedChange={setIsLeaf} id="is-leaf" />
            <Label htmlFor="is-leaf">Nodo hoja (resultado final)</Label>
          </div>
          {isLeaf && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Categoría resultado</Label>
                <Input value={resultCategory} onChange={(e) => setResultCategory(e.target.value)} placeholder="hardware" />
              </div>
              <div className="space-y-1.5">
                <Label>Subcategoría resultado</Label>
                <Input value={resultSubcategory} onChange={(e) => setResultSubcategory(e.target.value)} placeholder="computadora" />
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!question.trim() || creating || updating}>
            {isEdit ? 'Guardar' : 'Crear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Deploy dialog ─────────────────────────────────────────────────────────────

function DeployDialog({ open, rootNodeId, onClose }: { open: boolean; rootNodeId: string; onClose: () => void }) {
  const { mutate: deploy, isPending } = useDeployTree();
  const [changelog, setChangelog] = useState('');

  const handleDeploy = () => {
    deploy({ root_node_id: rootNodeId, changelog }, { onSuccess: onClose });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Publicar árbol de decisión</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            Esto reemplazará el árbol activo. Describí los cambios en el changelog.
          </p>
          <div className="space-y-1.5">
            <Label>Changelog</Label>
            <Textarea
              value={changelog}
              onChange={(e) => setChangelog(e.target.value)}
              rows={4}
              placeholder="Se agregaron nodos para problemas de red y VPN..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleDeploy} disabled={!changelog.trim() || isPending}>
            <Rocket className="mr-1.5 h-4 w-4" />
            Publicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Tree node row ─────────────────────────────────────────────────────────────

function NodeRow({
  node,
  depth,
  onEdit,
  onAddChild,
  onDelete,
}: {
  node: TreeNode;
  depth: number;
  onEdit: (n: TreeNode) => void;
  onAddChild: (parentId: string) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div>
      <div
        className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50 group"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        <button onClick={() => setExpanded((p) => !p)} className="shrink-0">
          {node.is_leaf ? (
            <Leaf className="h-4 w-4 text-green-600" />
          ) : (
            <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? 'rotate-90' : ''}`} />
          )}
        </button>
        <span className="text-sm flex-1 truncate">{node.question}</span>
        {node.is_leaf && (
          <Badge variant="secondary" className="text-xs">
            {node.result_category}/{node.result_subcategory}
          </Badge>
        )}
        <div className="hidden group-hover:flex items-center gap-1">
          {!node.is_leaf && (
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onAddChild(node.id)}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => onEdit(node)}>
            <GitBranch className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-destructive"
            onClick={() => onDelete(node.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TreePage() {
  const { data: treeData, isLoading } = useTree();
  const { data: versionsData } = useTreeVersions();
  const { mutate: deleteNode } = useDeleteTreeNode();

  const [nodeForm, setNodeForm] = useState<{ open: boolean; node?: TreeNode; parentId?: string }>({ open: false });
  const [deployOpen, setDeployOpen] = useState(false);

  const nodes = treeData?.nodes ?? [];
  const versions = versionsData?.versions ?? [];

  // Build tree structure for display (flat list sorted by parent/order)
  const rootNodes = nodes.filter((n) => n.parent_id === null);
  const getChildren = (parentId: string) => nodes.filter((n) => n.parent_id === parentId).sort((a, b) => a.order - b.order);

  const renderSubtree = (node: TreeNode, depth: number): React.ReactNode => (
    <div key={node.id}>
      <NodeRow
        node={node}
        depth={depth}
        onEdit={(n) => setNodeForm({ open: true, node: n })}
        onAddChild={(pid) => setNodeForm({ open: true, parentId: pid })}
        onDelete={(id) => { if (confirm('¿Eliminar nodo?')) deleteNode(id); }}
      />
      {!node.is_leaf && getChildren(node.id).map((child) => renderSubtree(child, depth + 1))}
    </div>
  );

  const firstRoot = rootNodes[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Árbol de decisión</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {nodes.length} nodos • {versions.length} versiones publicadas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setNodeForm({ open: true })}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nuevo nodo raíz
          </Button>
          {firstRoot && (
            <Button size="sm" onClick={() => setDeployOpen(true)}>
              <Rocket className="mr-1.5 h-4 w-4" />
              Publicar árbol
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tree */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Estructura del árbol</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-8" style={{ marginLeft: `${(i % 4) * 20}px` }} />
                  ))}
                </div>
              ) : nodes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <GitBranch className="mx-auto h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">El árbol está vacío. Agregá un nodo raíz para comenzar.</p>
                </div>
              ) : (
                <div className="divide-y divide-transparent">
                  {rootNodes.sort((a, b) => a.order - b.order).map((root) => renderSubtree(root, 0))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Versions sidebar */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" />
                Historial de versiones
              </CardTitle>
            </CardHeader>
            <CardContent>
              {versions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin versiones publicadas.</p>
              ) : (
                <div className="space-y-3">
                  {versions.slice(0, 8).map((v, i) => (
                    <div key={v.id} className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        {i === 0 && <Badge className="text-[10px] px-1 py-0">Actual</Badge>}
                        <span className="text-xs text-muted-foreground">
                          {new Date(v.deployed_at).toLocaleDateString('es-SV', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-xs line-clamp-2">{v.changelog}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      {nodeForm.open && (
        <NodeFormDialog
          open
          initial={nodeForm.node}
          parentId={nodeForm.parentId}
          onClose={() => setNodeForm({ open: false })}
        />
      )}
      {deployOpen && firstRoot && (
        <DeployDialog
          open
          rootNodeId={firstRoot.id}
          onClose={() => setDeployOpen(false)}
        />
      )}
    </div>
  );
}
