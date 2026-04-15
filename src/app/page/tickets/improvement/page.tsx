'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  description: z.string().min(20, 'Describí la mejora con al menos 20 caracteres'),
});

type FormValues = z.infer<typeof schema>;

export default function ImprovementPage() {
  const router = useRouter();
  const { mutateAsync, isPending } = useCreateTicket();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const selectedCategory = watch('category');
  const subcategories = selectedCategory ? (CATEGORY_TAXONOMY[selectedCategory] ?? []) : [];

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);
    try {
      const ticket = await mutateAsync({
        type: 'improvement_request',
        category: values.category,
        subcategory: values.subcategory,
        priority: 'P4',
        description: values.description,
      });
      router.push(`/page/tickets/${ticket.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error al enviar la solicitud');
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
        <div>
          <h1 className="text-xl font-bold">Solicitud de mejora</h1>
          <p className="text-sm text-muted-foreground">
            Proponé una mejora a algún sistema, proceso o herramienta.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Categoría */}
        <div className="space-y-1.5">
          <Label>Área relacionada *</Label>
          <Select
            onValueChange={(val) => {
              setValue('category', val, { shouldValidate: true });
              setValue('subcategory', '');
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccioná un área" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(CATEGORY_TAXONOMY).map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.category && <p className="text-xs text-red-600">{errors.category.message}</p>}
        </div>

        {/* Subcategoría */}
        <div className="space-y-1.5">
          <Label>Sistema o herramienta *</Label>
          <Select
            disabled={!selectedCategory}
            onValueChange={(val) => setValue('subcategory', val, { shouldValidate: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder={selectedCategory ? 'Seleccioná' : 'Primero elegí área'} />
            </SelectTrigger>
            <SelectContent>
              {subcategories.map((sub) => (
                <SelectItem key={sub} value={sub}>
                  {sub.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.subcategory && <p className="text-xs text-red-600">{errors.subcategory.message}</p>}
        </div>

        {/* Descripción */}
        <div className="space-y-1.5">
          <Label htmlFor="description">Descripción de la mejora *</Label>
          <Textarea
            id="description"
            placeholder="¿Qué mejorarías? ¿Cuál es el problema actual? ¿Cuál sería el beneficio esperado?"
            className="min-h-[140px]"
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
            {isPending ? 'Enviando...' : 'Enviar solicitud de mejora'}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/page/tickets">Cancelar</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
