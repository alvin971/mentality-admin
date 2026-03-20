// src/components/scoring/panels/DigitSpanPanel.tsx
// Panel for Empan Chiffres (Forward / Backward / Sequencing)
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { scoringService } from '@/services/scoring.service'
import { useAuth } from '@/hooks/useAuth'
import type { DigitSpanConfig, SpanLevel } from '@/types/scoring'

interface Props {
  testId: string
  config: DigitSpanConfig
  onSaved: () => void
}

type PartKey = 'forward' | 'backward' | 'sequencing'

const PART_LABELS: Record<PartKey, string> = {
  forward:    'Empan Direct',
  backward:   'Empan Inverse',
  sequencing: 'Séquençage',
}

const PART_DESCRIPTIONS: Record<PartKey, string> = {
  forward:    'Répéter dans le même ordre',
  backward:   'Répéter en ordre inverse',
  sequencing: 'Répéter en ordre croissant',
}

export function DigitSpanPanel({ testId, config, onSaved }: Props) {
  const { user } = useAuth()
  const [localConfig, setLocalConfig] = useState<DigitSpanConfig>(config)
  const [activePart, setActivePart] = useState<PartKey>('forward')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalItems = Object.values(localConfig.parts).reduce((sum, part) => sum + part.length * 2, 0)

  function updateLevel(part: PartKey, idx: number, patch: Partial<SpanLevel>) {
    setLocalConfig(prev => ({
      ...prev,
      parts: {
        ...prev.parts,
        [part]: prev.parts[part].map((level, i) => i === idx ? { ...level, ...patch } : level),
      },
    }))
  }

  function updateSequence(part: PartKey, levelIdx: number, seqIdx: number, value: string) {
    const digits = value.replace(/[^0-9,\s]/g, '').split(/[,\s]+/).map(s => s.trim()).filter(Boolean)
    const currentLevel = localConfig.parts[part][levelIdx]
    const newSequences = currentLevel.sequences.map((seq, i) => i === seqIdx ? digits : seq)
    updateLevel(part, levelIdx, { sequences: newSequences })
  }

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

  const currentPart = localConfig.parts[activePart]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-clinical-text">{localConfig.name}</h2>
          <p className="text-xs text-clinical-muted mt-0.5">
            {totalItems} items · Discontinuation : {localConfig.discontinuation_rule.fails_per_length} échec(s) par longueur
          </p>
        </div>
        <Button size="sm" loading={saving} onClick={handleSave}>Sauvegarder</Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Part tabs */}
      <div className="flex border-b border-clinical-border mb-4 gap-1">
        {(Object.keys(PART_LABELS) as PartKey[]).map(part => (
          <button
            key={part}
            type="button"
            onClick={() => setActivePart(part)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activePart === part
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-clinical-muted hover:text-clinical-text'
            }`}
          >
            {PART_LABELS[part]}
            <span className="ml-1.5 text-xs text-clinical-muted">({localConfig.parts[part].length} niv.)</span>
          </button>
        ))}
      </div>

      <p className="text-xs text-clinical-muted mb-3 italic">{PART_DESCRIPTIONS[activePart]}</p>

      {/* Levels for current part */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {currentPart.map((level, levelIdx) => (
          <div key={levelIdx} className="border border-clinical-border rounded-lg p-3">
            <div className="flex items-center gap-4 mb-2">
              <span className="text-sm font-semibold text-clinical-text">Longueur {level.length}</span>
              <div className="flex items-center gap-2">
                <label className="text-xs text-clinical-muted">Theta IRT</label>
                <input
                  type="number"
                  step="0.1"
                  value={level.theta}
                  onChange={e => updateLevel(activePart, levelIdx, { theta: parseFloat(e.target.value) || 0 })}
                  className="w-20 rounded border border-clinical-border bg-white px-2 py-1 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {level.sequences.map((seq, seqIdx) => (
                <div key={seqIdx}>
                  <label className="text-xs text-clinical-muted mb-1 block">Essai {seqIdx + 1}</label>
                  <input
                    type="text"
                    value={seq.join(' ')}
                    onChange={e => updateSequence(activePart, levelIdx, seqIdx, e.target.value)}
                    placeholder={`Ex: ${Array.from({ length: level.length }, (_, i) => (i + 1) % 10).join(' ')}`}
                    className="w-full rounded border border-clinical-border bg-white px-3 py-1.5 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
