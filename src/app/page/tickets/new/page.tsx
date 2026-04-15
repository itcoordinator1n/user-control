'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateTicket } from '@/hooks/useTicketQueries';
import { CATEGORY_TAXONOMY } from '@/types/tickets';

const schema = z.object({
  category: z.string().min(1, 'Seleccioná una categoría'),
  subcategory: z.string().min(1, 'Seleccioná una subcategoría'),
  problem_type: z.string().optional(),
  priority: z.enum(['P1', 'P2', 'P3', 'P4'], { required_error: 'Seleccioná una prioridad' }),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
});

type FormValues = z.infer<typeof schema>;

const PRIORITY_OPTIONS = [
  { value: 'P1', label: 'P1 — Crítico (afecta producción)' },
  { value: 'P2', label: 'P2 — Alto (impacto grave)' },
  { value: 'P3', label: 'P3 — Medio (inconveniente)' },
  { value: 'P4', label: 'P4 — Bajo (consulta o mejora menor)' },
];

export default function NewTicketPage() {
  const router = useRouter();
  const { mutateAsync, isPending } = useCreateTicket();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'P3' },
  });

  const selectedCategory = watch('category');
  const subcategories = selectedCategory ? (CATEGORY_TAXONOMY[selectedCategory] ?? []) : [];

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    try {
      const ticket = await mutateAsync({
        type: 'incident',
        category: values.category,
        subcategory: values.subcategory,
        problem_type: values.problem_type || undefined,
        priority: values.priority,
        description: values.description,
      });
      router.push(`/page/tickets/${ticket.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error al crear el ticket');
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/page/tickets">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Nueva solicitud de soporte</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Categoría */}
        <div className="space-y-1.5">
          <Label htmlFor="category">Categoría *</Label>
          <Select
            onValueChange={(val) => {
              setValue('category', val, { shouldValidate: true });
              setValue('subcategory', '');
            }}
          >
            <SelectTrigger id="category">
              <SelectValue placeholder="Seleccioná una categoría" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(CATEGORY_TAXONOMY).map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && (
            <p className="text-xs text-red-600">{errors.category.message}</p>
          )}
        </div>

        {/* Subcategoría */}
        <div className="space-y-1.5">
          <Label htmlFor="subcategory">Subcategoría *</Label>
          <Select
            disabled={!selectedCategory}
            onValueChange={(val) => setValue('subcategory', val, { shouldValidate: true })}
          >
            <SelectTrigger id="subcategory">
              <SelectValue placeholder={selectedCategory ? 'Seleccioná' : 'Primero elegí categoría'} />
            </SelectTrigger>
            <SelectContent>
              {subcategories.map((sub) => (
                <SelectItem key={sub} value={sub}>
                  {sub.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.subcategory && (
            <p className="text-xs text-red-600">{errors.subcategory.message}</p>
          )}
        </div>

        {/* Tipo de problema */}
        <div className="space-y-1.5">
          <Label htmlFor="problem_type">Tipo de problema (opcional)</Label>
          <Input
            id="problem_type"
            placeholder="Ej: sin_señal, pantalla_azul..."
            {...register('problem_type')}
          />
        </div>

        {/* Prioridad */}
        <div className="space-y-1.5">
          <Label htmlFor="priority">Prioridad *</Label>
          <Select
            defaultValue="P3"
            onValueChange={(val) => setValue('priority', val as 'P1' | 'P2' | 'P3' | 'P4', { shouldValidate: true })}
          >
            <SelectTrigger id="priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.priority && (
            <p className="text-xs text-red-600">{errors.priority.message}</p>
          )}
        </div>

        {/* Descripción */}
        <div className="space-y-1.5">
          <Label htmlFor="description">Descripción del problema *</Label>
          <Textarea
            id="description"
            placeholder="Describí el problema con el mayor detalle posible..."
            className="min-h-[120px]"
            {...register('description')}
          />
          {errors.description && (
            <p className="text-xs text-red-600">{errors.description.message}</p>
          )}
        </div>

        {submitError && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-400">
            {submitError}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" disabled={isPending} className="flex-1">
            {isPending ? 'Enviando...' : 'Enviar solicitud'}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/page/tickets">Cancelar</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
