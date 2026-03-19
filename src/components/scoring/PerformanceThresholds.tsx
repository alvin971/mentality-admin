// src/components/scoring/PerformanceThresholds.tsx
import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/Input'
import type { TestConfigJson } from '@/types'

const LEVELS = [
  { key: 'very_low',  label: 'Très faible',  color: 'text-red-600' },
  { key: 'low',       label: 'Faible',        color: 'text-orange-500' },
  { key: 'average',   label: 'Moyen',         color: 'text-yellow-600' },
  { key: 'high',      label: 'Élevé',         color: 'text-blue-600' },
  { key: 'very_high', label: 'Très élevé',    color: 'text-emerald-600' },
] as const

export function PerformanceThresholds() {
  const { register } = useFormContext<TestConfigJson>()

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-clinical-text">Seuils de performance (scores bruts)</p>
      <div className="space-y-2">
        {LEVELS.map(level => (
          <div key={level.key} className="flex items-center gap-3">
            <span className={`text-sm font-medium w-24 flex-shrink-0 ${level.color}`}>
              {level.label}
            </span>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Min"
                min={0}
                className="w-20"
                {...register(`thresholds.${level.key}.0`, { valueAsNumber: true })}
              />
              <span className="text-clinical-muted text-sm">—</span>
              <Input
                type="number"
                placeholder="Max"
                min={0}
                className="w-20"
                {...register(`thresholds.${level.key}.1`, { valueAsNumber: true })}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
