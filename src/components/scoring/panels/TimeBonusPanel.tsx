// src/components/scoring/panels/TimeBonusPanel.tsx
// Panel for tests with time-bonus scoring (Cubes, Arithmétique)
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { scoringService } from '@/services/scoring.service'
import { useAuth } from '@/hooks/useAuth'
import type { TimeBonusConfig, TimeBonusItem } from '@/types/scoring'

interface Props {
  testId: string
  config: TimeBonusConfig
  onSaved: () => void
}

export function TimeBonusPanel({ testId, config, onSaved }: Props) {
  const { user } = useAuth()
  const [localConfig, setLocalConfig] = useState<TimeBonusConfig>(config)
  const [saving, setSaving] = useState(false)
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function updateItem(idx: number, patch: Partial<TimeBonusItem>) {
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

  const scorableItems = localConfig.items.filter(i => i.base_score > 0)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-clinical-text">{localConfig.name}</h2>
          <p className="text-xs text-clinical-muted mt-0.5">
            {localConfig.items.length} items ({scorableItems.length} scorés) ·
            Discontinuation : {localConfig.discontinuation_rule.consecutive_fails} échecs consécutifs
          </p>
        </div>
        <Button size="sm" loading={saving} onClick={handleSave}>Sauvegarder</Button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Discontinuation */}
      <div className="mb-4 flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
        <span className="text-sm text-clinical-subtle">Discontinuation :</span>
        <Input
          type="number"
          min={0}
          max={10}
          value={localConfig.discontinuation_rule.consecutive_fails}
          onChange={e => setLocalConfig(prev => ({
            ...prev,
            discontinuation_rule: { consecutive_fails: parseInt(e.target.value) || 0 },
          }))}
          className="w-20"
        />
        <span className="text-sm text-clinical-muted">échecs consécutifs</span>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {localConfig.items.map((item, idx) => (
          <div key={item.id} className="border border-clinical-border rounded-lg overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center gap-3 px-4 py-2.5 bg-white hover:bg-gray-50 text-left"
              onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
            >
              <span className="text-xs font-mono text-clinical-muted w-8">{String(idx + 1).padStart(2, '0')}</span>
              <span className="flex-1 text-sm text-clinical-text truncate">{item.label}</span>
              {item.base_score === 0 ? (
                <span className="text-xs text-clinical-muted bg-gray-100 px-2 py-0.5 rounded">Exemple</span>
              ) : (
                <>
                  <span className="text-xs text-clinical-muted">{item.time_limit_s}s</span>
                  <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    {item.bonus_thresholds.length > 0
                      ? `+${item.bonus_thresholds[0].bonus}pts bonus`
                      : 'Sans bonus'}
                  </span>
                </>
              )}
              <svg
                className={`w-4 h-4 text-clinical-muted transition-transform flex-shrink-0 ${expandedItem === item.id ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {expandedItem === item.id && (
              <div className="px-4 pb-4 pt-2 bg-gray-50 border-t border-clinical-border">
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="text-xs font-medium text-clinical-muted">Score de base</label>
                    <input
                      type="number"
                      min={0}
                      value={item.base_score}
                      onChange={e => updateItem(idx, { base_score: parseInt(e.target.value) || 0 })}
                      className="mt-1 w-full rounded border border-clinical-border bg-white px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-clinical-muted">Temps limite (s)</label>
                    <input
                      type="number"
                      min={0}
                      value={item.time_limit_s}
                      onChange={e => updateItem(idx, { time_limit_s: parseInt(e.target.value) || 0 })}
                      className="mt-1 w-full rounded border border-clinical-border bg-white px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-clinical-muted">Niveau</label>
                    <input
                      type="number"
                      min={0}
                      max={5}
                      value={item.level}
                      onChange={e => updateItem(idx, { level: parseInt(e.target.value) || 0 })}
                      className="mt-1 w-full rounded border border-clinical-border bg-white px-2 py-1 text-sm"
                    />
                  </div>
                </div>

                {item.bonus_thresholds.length > 0 && (
                  <div>
                    <label className="text-xs font-semibold text-clinical-muted uppercase tracking-wide mb-2 block">
                      Seuils de bonus temps
                    </label>
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-clinical-border">
                          <th className="text-left px-2 py-1 text-clinical-muted">Si complété en ≤ X secondes</th>
                          <th className="text-left px-2 py-1 text-clinical-muted">Bonus (pts)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.bonus_thresholds.map((threshold, tIdx) => (
                          <tr key={tIdx} className="border-b border-clinical-border">
                            <td className="px-2 py-1">
                              <input
                                type="number"
                                value={threshold.max_seconds}
                                onChange={e => {
                                  const newThresholds = [...item.bonus_thresholds]
                                  newThresholds[tIdx] = { ...threshold, max_seconds: parseInt(e.target.value) || 0 }
                                  updateItem(idx, { bonus_thresholds: newThresholds })
                                }}
                                className="w-24 rounded border border-clinical-border bg-white px-2 py-0.5"
                              />
                            </td>
                            <td className="px-2 py-1">
                              <input
                                type="number"
                                value={threshold.bonus}
                                onChange={e => {
                                  const newThresholds = [...item.bonus_thresholds]
                                  newThresholds[tIdx] = { ...threshold, bonus: parseInt(e.target.value) || 0 }
                                  updateItem(idx, { bonus_thresholds: newThresholds })
                                }}
                                className="w-16 rounded border border-clinical-border bg-white px-2 py-0.5"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
