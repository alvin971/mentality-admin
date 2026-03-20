// src/components/scoring/panels/PartialScoringPanel.tsx
// Panel for tests with partial scoring 0/1/2 (Similitudes, Vocabulaire)
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { scoringService } from '@/services/scoring.service'
import { useAuth } from '@/hooks/useAuth'
import type { PartialScoringConfig, PartialScoringItem } from '@/types/scoring'

interface Props {
  testId: string
  config: PartialScoringConfig
  onSaved: () => void
}

const LEVEL_LABELS: Record<number, string> = { 1: 'Concret', 2: 'Fonctionnel', 3: 'Catégoriel', 4: 'Abstrait', 5: 'Très difficile' }
const LEVEL_COLORS: Record<number, string> = {
  1: 'bg-green-100 text-green-700',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-violet-100 text-violet-700',
  4: 'bg-orange-100 text-orange-700',
  5: 'bg-red-100 text-red-700',
}

export function PartialScoringPanel({ testId, config, onSaved }: Props) {
  const { user } = useAuth()
  const [localConfig, setLocalConfig] = useState<PartialScoringConfig>(config)
  const [saving, setSaving] = useState(false)
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function updateItem(idx: number, patch: Partial<PartialScoringItem>) {
    setLocalConfig(prev => ({
      ...prev,
      items: prev.items.map((item, i) => i === idx ? { ...item, ...patch } : item),
    }))
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

  const maxScore = localConfig.items.reduce((sum) => sum + 2, 0)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-clinical-text">{localConfig.name}</h2>
          <p className="text-xs text-clinical-muted mt-0.5">
            {localConfig.items.length} items · Score max {maxScore} pts ·
            Discontinuation : {localConfig.discontinuation_rule.consecutive_zeros === 0
              ? 'Désactivée'
              : `${localConfig.discontinuation_rule.consecutive_zeros} zéros consécutifs`}
          </p>
        </div>
        <Button size="sm" loading={saving} onClick={handleSave}>Sauvegarder</Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Discontinuation rule */}
      <div className="mb-4 flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
        <span className="text-sm text-clinical-subtle">Discontinuation :</span>
        <Input
          type="number"
          min={0}
          max={10}
          value={localConfig.discontinuation_rule.consecutive_zeros}
          onChange={e => setLocalConfig(prev => ({
            ...prev,
            discontinuation_rule: { consecutive_zeros: parseInt(e.target.value) || 0 },
          }))}
          className="w-20"
        />
        <span className="text-sm text-clinical-muted">zéros consécutifs (0 = désactivée)</span>
      </div>

      {/* Items table */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-1">
          {localConfig.items.map((item, idx) => (
            <div key={item.id} className="border border-clinical-border rounded-lg overflow-hidden">
              {/* Row header */}
              <button
                type="button"
                className="w-full flex items-center gap-3 px-4 py-2.5 bg-white hover:bg-gray-50 text-left"
                onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
              >
                <span className="text-xs font-mono text-clinical-muted w-8">{String(idx + 1).padStart(2, '0')}</span>
                <span
                  className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${LEVEL_COLORS[item.level] ?? 'bg-gray-100 text-gray-700'}`}
                >
                  {LEVEL_LABELS[item.level] ?? `N${item.level}`}
                </span>
                <span className="flex-1 text-sm text-clinical-text truncate">{item.label}</span>
                <span className="text-xs text-clinical-muted">θ={item.theta.toFixed(1)}</span>
                <span className="text-xs text-brand-600 font-medium">0/1/2 pts</span>
                <svg
                  className={`w-4 h-4 text-clinical-muted transition-transform flex-shrink-0 ${expandedItem === item.id ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Expanded details */}
              {expandedItem === item.id && (
                <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-clinical-border space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-clinical-muted uppercase tracking-wide">Critères 2 points</label>
                      <textarea
                        className="mt-1 w-full rounded border border-clinical-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        rows={2}
                        value={item.score_2_criteria}
                        onChange={e => updateItem(idx, { score_2_criteria: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-clinical-muted uppercase tracking-wide">Critères 1 point</label>
                      <textarea
                        className="mt-1 w-full rounded border border-clinical-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        rows={2}
                        value={item.score_1_criteria}
                        onChange={e => updateItem(idx, { score_1_criteria: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-clinical-muted uppercase tracking-wide">Mots-clés 2 pts (séparés par virgule)</label>
                      <input
                        type="text"
                        className="mt-1 w-full rounded border border-clinical-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        value={item.keywords_2.join(', ')}
                        onChange={e => updateItem(idx, { keywords_2: e.target.value.split(',').map(k => k.trim()).filter(Boolean) })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-clinical-muted uppercase tracking-wide">Mots-clés 1 pt (séparés par virgule)</label>
                      <input
                        type="text"
                        className="mt-1 w-full rounded border border-clinical-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                        value={item.keywords_1.join(', ')}
                        onChange={e => updateItem(idx, { keywords_1: e.target.value.split(',').map(k => k.trim()).filter(Boolean) })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-clinical-muted">Niveau</label>
                      <select
                        value={item.level}
                        onChange={e => updateItem(idx, { level: parseInt(e.target.value) })}
                        className="rounded border border-clinical-border bg-white px-2 py-1 text-sm"
                      >
                        {[1,2,3,4,5].map(l => <option key={l} value={l}>{LEVEL_LABELS[l] ?? l}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-clinical-muted">Theta IRT</label>
                      <input
                        type="number"
                        step="0.1"
                        value={item.theta}
                        onChange={e => updateItem(idx, { theta: parseFloat(e.target.value) || 0 })}
                        className="w-24 rounded border border-clinical-border bg-white px-2 py-1 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
