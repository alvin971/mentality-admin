// src/components/scoring/RawScoreTable.tsx
import { useFieldArray, useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { TestConfigJson } from '@/types'

export function RawScoreTable() {
  const { register, control, formState: { errors } } = useFormContext<TestConfigJson>()
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-clinical-text">Items du test</p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => append({ item_id: crypto.randomUUID(), label: '', max_score: 2, partial_score: 1, keywords: [] })}
        >
          + Ajouter un item
        </Button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-clinical-muted text-center py-8 border border-dashed border-clinical-border rounded-lg">
          Aucun item défini. Cliquez sur "Ajouter un item" pour commencer.
        </p>
      )}

      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-[1fr_80px_80px_1fr_auto] gap-2 items-start">
            <Input
              placeholder="Label de l'item"
              {...register(`items.${index}.label`)}
              error={errors.items?.[index]?.label?.message}
            />
            <Input
              type="number"
              placeholder="Max"
              min={0}
              {...register(`items.${index}.max_score`, { valueAsNumber: true })}
            />
            <Input
              type="number"
              placeholder="Partiel"
              min={0}
              {...register(`items.${index}.partial_score`, { valueAsNumber: true })}
            />
            <Input
              placeholder="Mots-clés (virgule)"
              {...register(`items.${index}.keywords.0`)}
            />
            <button
              type="button"
              onClick={() => remove(index)}
              className="text-clinical-muted hover:text-red-500 transition-colors mt-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {fields.length > 0 && (
        <div className="grid grid-cols-[1fr_80px_80px_1fr_auto] gap-2 px-0">
          <span className="text-xs text-clinical-muted px-3">Label</span>
          <span className="text-xs text-clinical-muted">Score max</span>
          <span className="text-xs text-clinical-muted">Partiel</span>
          <span className="text-xs text-clinical-muted">Mots-clés</span>
          <span />
        </div>
      )}
    </div>
  )
}
