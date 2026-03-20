// src/components/scoring/panels/SpeedPanel.tsx
// Panel for timed speed tests (Code, Recherche Symboles)
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { scoringService } from '@/services/scoring.service'
import { useAuth } from '@/hooks/useAuth'
import type { SpeedConfig } from '@/types/scoring'

interface Props {
  testId: string
  config: SpeedConfig
  onSaved: () => void
}

export function SpeedPanel({ testId, config, onSaved }: Props) {
  const { user } = useAuth()
  const [localConfig, setLocalConfig] = useState<SpeedConfig>(config)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!user) return
    setSaving(true)
    setError(null)
    try {
      await scoringService.save(testId, localConfig as never, user.id)
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const avgPerMinute = localConfig.time_limit_s > 0
    ? Math.round((localConfig.total_items / localConfig.time_limit_s) * 60)
    : 0

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-clinical-text">{localConfig.name}</h2>
          <p className="text-xs text-clinical-muted mt-0.5">
            Test de vitesse · {localConfig.total_items} items · {localConfig.time_limit_s}s
          </p>
        </div>
        <Button size="sm" loading={saving} onClick={handleSave}>Sauvegarder</Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="max-w-md space-y-6">
        {/* Key stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-blue-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-700">{localConfig.time_limit_s}s</p>
            <p className="text-xs text-blue-600 mt-0.5">Temps limite</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-emerald-700">{localConfig.total_items}</p>
            <p className="text-xs text-emerald-600 mt-0.5">Items total</p>
          </div>
          <div className="p-3 bg-violet-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-violet-700">{avgPerMinute}</p>
            <p className="text-xs text-violet-600 mt-0.5">Items/min (max)</p>
          </div>
        </div>

        {/* Config fields */}
        <div className="space-y-4">
          <Input
            type="number"
            label="Temps limite (secondes)"
            min={10}
            max={600}
            value={localConfig.time_limit_s}
            onChange={e => setLocalConfig(prev => ({ ...prev, time_limit_s: parseInt(e.target.value) || 120 }))}
          />
          <Input
            type="number"
            label="Nombre total d'items"
            min={1}
            value={localConfig.total_items}
            onChange={e => setLocalConfig(prev => ({ ...prev, total_items: parseInt(e.target.value) || 0 }))}
          />
          <Input
            type="number"
            label="Items d'entraînement (avant chrono)"
            min={0}
            value={localConfig.training_items}
            onChange={e => setLocalConfig(prev => ({ ...prev, training_items: parseInt(e.target.value) || 0 }))}
          />
        </div>

        {/* Scoring rule */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm font-medium text-amber-800 mb-1">Règle de scoring</p>
          <p className="text-sm text-amber-700">
            1 point par item correctement complété dans le temps imparti.
            Les items d'entraînement ne comptent pas dans le score final.
          </p>
          <p className="text-xs text-amber-600 mt-2">
            Score max théorique : <span className="font-semibold">{localConfig.total_items} points</span>
          </p>
        </div>
      </div>
    </div>
  )
}
