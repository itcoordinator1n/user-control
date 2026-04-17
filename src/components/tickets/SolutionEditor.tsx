'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useCreateSolution, useFinalizeSolution, useUpdateTicketStatus } from '@/hooks/useTicketQueries';
import { ROOT_CAUSE_LABELS } from '@/types/tickets';
import type { RootCause, TicketSolution } from '@/types/tickets';

const ROOT_CAUSES = Object.entries(ROOT_CAUSE_LABELS) as [RootCause, string][];

const schema = z.object({
  diagnosis:        z.string().min(5, 'Requerido'),
  solution_applied: z.string().min(5, 'Requerido'),
  steps:            z.string().min(5, 'Requerido'),
  root_cause:       z.enum(['config_error','hardware_failure','software_bug','user_error',
                             'network_issue','permission_issue','external_service','capacity','unknown']),
  is_reusable:      z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface SolutionEditorProps {
  ticketId: string;
  existingSolution?: TicketSolution;
  onResolved?: () => void;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'unsaved';

export function SolutionEditor({ ticketId, existingSolution, onResolved }: SolutionEditorProps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(existingSolution ? 'saved' : 'idle');
  const [finalizeError, setFinalizeError] = useState<string | null>(null);
  const isDirtyRef = useRef(false);
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { mutate: saveDraft } = useCreateSolution(ticketId);
  const { mutate: finalize, isPending: isFinalizing } = useFinalizeSolution(ticketId);
  const { mutate: updateStatus } = useUpdateTicketStatus();

  const {
    register, handleSubmit, watch, setValue, formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: existingSolution ? {
      diagnosis:        existingSolution.diagnosis,
      solution_applied: existingSolution.solution_applied,
      steps:            existingSolution.steps,
      root_cause:       existingSolution.root_cause,
      is_reusable:      existingSolution.is_reusable,
    } : { is_reusable: false },
  });

  const stepsValue = watch('steps');

  // Marcar dirty en cualquier cambio
  useEffect(() => {
    const sub = watch(() => {
      isDirtyRef.current = true;
      setSaveStatus('unsaved');
    });
    return () => sub.unsubscribe();
  }, [watch]);

  // Auto-save cada 30s
  useEffect(() => {
    autoSaveRef.current = setInterval(() => {
      if (!isDirtyRef.current) return;
      handleSubmit(doSaveDraft)();
    }, 30_000);
    return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const doSaveDraft = (values: FormValues) => {
    setSaveStatus('saving');
    saveDraft(values, {
      onSuccess: () => {
        setSaveStatus('saved');
        isDirtyRef.current = false;
      },
      onError: () => setSaveStatus('unsaved'),
    });
  };

  const handleFinalize = () => {
    setFinalizeError(null);
    const solutionApplied = watch('solution_applied');
    
    finalize(undefined, {
      onSuccess: () => {
        updateStatus({ 
          id: ticketId, 
          to_status: 'resolved',
          reason: solutionApplied 
        }, {
          onSuccess: () => onResolved?.(),
          onError: (err) => setFinalizeError(err.message),
        });
      },
      onError: (err) => setFinalizeError(err.message),
    });
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto space-y-4 p-4">
      {/* Indicador de guardado */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Documentación</span>
        <SaveIndicator status={saveStatus} />
      </div>

      {/* Diagnóstico */}
      <Field label="Diagnóstico *" error={errors.diagnosis?.message}>
        <Textarea
          {...register('diagnosis')}
          placeholder="¿Cuál era el problema real?"
          className="min-h-[70px] resize-none text-sm"
        />
      </Field>

      {/* Solución aplicada */}
      <Field label="Solución aplicada *" error={errors.solution_applied?.message}>
        <Textarea
          {...register('solution_applied')}
          placeholder="¿Qué se hizo para resolverlo?"
          className="min-h-[70px] resize-none text-sm"
        />
      </Field>

      {/* Pasos — editor + preview */}
      <Field label="Pasos (markdown) *" error={errors.steps?.message}>
        <div className="grid grid-cols-2 gap-2">
          <Textarea
            {...register('steps')}
            placeholder={"1. Paso uno\n2. Paso dos\n3. Paso tres"}
            className="min-h-[100px] resize-none text-sm font-mono"
          />
          <pre className="min-h-[100px] rounded-md border bg-muted/40 p-2 text-xs overflow-auto whitespace-pre-wrap">
            {stepsValue || <span className="text-muted-foreground">Preview...</span>}
          </pre>
        </div>
      </Field>

      {/* Causa raíz */}
      <Field label="Causa raíz *" error={errors.root_cause?.message}>
        <Select
          defaultValue={existingSolution?.root_cause}
          onValueChange={(v) => setValue('root_cause', v as RootCause, { shouldValidate: true })}
        >
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Seleccioná" />
          </SelectTrigger>
          <SelectContent>
            {ROOT_CAUSES.map(([val, label]) => (
              <SelectItem key={val} value={val}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {/* Reutilizable */}
      <div className="flex items-center gap-3">
        <Switch
          id="reusable"
          defaultChecked={existingSolution?.is_reusable ?? false}
          onCheckedChange={(v) => setValue('is_reusable', v)}
        />
        <Label htmlFor="reusable" className="text-sm cursor-pointer">
          Agregar a la base de conocimiento
        </Label>
      </div>

      {finalizeError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-400">
          {finalizeError}
        </p>
      )}

      {/* Acciones */}
      <div className="flex gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSubmit(doSaveDraft)}
          disabled={saveStatus === 'saving'}
          className="flex-1"
        >
          <Save className="mr-1.5 h-3.5 w-3.5" />
          Guardar borrador
        </Button>

        <Button
          size="sm"
          disabled={!isValid || isFinalizing}
          onClick={handleFinalize}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
        >
          {isFinalizing ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="mr-1.5 h-3.5 w-3.5" />
          )}
          Marcar como resuelto
        </Button>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === 'idle') return null;
  if (status === 'saving') return (
    <span className="flex items-center gap-1 text-xs text-muted-foreground">
      <Loader2 className="h-3 w-3 animate-spin" /> Guardando...
    </span>
  );
  if (status === 'saved') return (
    <span className="flex items-center gap-1 text-xs text-green-600">
      <Check className="h-3 w-3" /> Guardado ✓
    </span>
  );
  return (
    <span className="text-xs text-orange-500">Sin guardar</span>
  );
}
