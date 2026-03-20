// src/components/scoring/panels/DichotomicPanel.tsx
// Panel for tests with binary 0/1 scoring (Information, Matrices, Balances, Puzzles, Mémoire Images)
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { scoringService } from '@/services/scoring.service'
import { useAuth } from '@/hooks/useAuth'
import type { DichotomicConfig, DichotomicItem } from '@/types/scoring'

interface Props {
  testId: string
  config: DichotomicConfig
  onSaved: () => void
}

export function DichotomicPanel({ testId, config, onSaved }: Props) {
  const { user } = useAuth()
  const [localConfig, setLocalConfig] = useState<DichotomicConfig>(config)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Group by domain if any items have domains
  const hasDomains = localConfig.items.some(i => i.domain)

  function updateItem(idx: number, patch: Partial<DichotomicItem>) {
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold text-clinical-text">{localConfig.name}</h2>
          <p className="text-xs text-clinical-muted mt-0.5">
            {localConfig.items.length} items · Score max {localConfig.items.length} pts ·
            Discontinuation : {!localConfig.discontinuation_rule || localConfig.discontinuation_rule.consecutive_fails === 0
              ? 'Désactivée'
              : `${localConfig.discontinuation_rule.consecutive_fails} échecs consécutifs`}
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
          value={localConfig.discontinuation_rule?.consecutive_fails ?? 0}
          onChange={e => {
            const val = parseInt(e.target.value) || 0
            setLocalConfig(prev => ({
              ...prev,
              discontinuation_rule: val === 0 ? null : { consecutive_fails: val },
            }))
          }}
          className="w-20"
        />
        <span className="text-sm text-clinical-muted">échecs consécutifs (0 = désactivée)</span>
      </div>

      {/* Items table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-clinical-border bg-gray-50">
              <th className="text-left px-3 py-2 text-xs font-semibold text-clinical-muted">#</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-clinical-muted">Énoncé / Label</th>
              {hasDomains && <th className="text-left px-3 py-2 text-xs font-semibold text-clinical-muted">Domaine</th>}
              <th className="text-left px-3 py-2 text-xs font-semibold text-clinical-muted">Bonne réponse</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-clinical-muted w-20">Niveau</th>
              <th className="text-left px-3 py-2 text-xs font-semibold text-clinical-muted w-20">Theta</th>
            </tr>
          </thead>
          <tbody>
            {localConfig.items.map((item, idx) => (
              <tr key={item.id} className="border-b border-clinical-border hover:bg-gray-50">
                <td className="px-3 py-2 font-mono text-xs text-clinical-muted">{String(idx + 1).padStart(2, '0')}</td>
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={item.label}
                    onChange={e => updateItem(idx, { label: e.target.value })}
                    className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-clinical-text hover:border-clinical-border focus:border-brand-500 focus:outline-none"
                  />
                </td>
                {hasDomains && (
                  <td className="px-3 py-2 text-xs text-clinical-muted">{item.domain ?? '—'}</td>
                )}
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={item.correct_answer ?? ''}
                    onChange={e => updateItem(idx, { correct_answer: e.target.value })}
                    placeholder="Réponse"
                    className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-green-700 hover:border-clinical-border focus:border-brand-500 focus:outline-none"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={item.level}
                    onChange={e => updateItem(idx, { level: parseInt(e.target.value) || 1 })}
                    className="w-16 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-center hover:border-clinical-border focus:border-brand-500 focus:outline-none"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    step="0.1"
                    value={item.theta}
                    onChange={e => updateItem(idx, { theta: parseFloat(e.target.value) || 0 })}
                    className="w-16 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm text-center hover:border-clinical-border focus:border-brand-500 focus:outline-none"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
