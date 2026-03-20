// src/components/scoring/ScoreConfigPanel.tsx
// Router: dispatches to the correct specialized panel based on test type
import { WAIS_TESTS } from '@/types'
import { TEST_TYPE_MAP, SCORING_TYPE_LABELS, SCORING_TYPE_COLORS } from '@/types/scoring'
import { TEST_SEEDS } from '@/data/test-seeds'
import { PartialScoringPanel } from './panels/PartialScoringPanel'
import { DichotomicPanel } from './panels/DichotomicPanel'
import { TimeBonusPanel } from './panels/TimeBonusPanel'
import { DigitSpanPanel } from './panels/DigitSpanPanel'
import { SpeedPanel } from './panels/SpeedPanel'
import type { TestConfiguration } from '@/types'
import type { WaisTestConfig } from '@/types/scoring'

interface ScoreConfigPanelProps {
  testId: string
  existingConfig: TestConfiguration | null
  onSaved: () => void
}

export function ScoreConfigPanel({ testId, existingConfig, onSaved }: ScoreConfigPanelProps) {
  WAIS_TESTS.find(t => t.id === testId)
  const scoringType = TEST_TYPE_MAP[testId]

  // Resolve config: use saved config_json if available, else fall back to seed
  const resolvedConfig: WaisTestConfig = existingConfig?.config_json
    ? existingConfig.config_json as unknown as WaisTestConfig
    : TEST_SEEDS[testId]

  if (!resolvedConfig) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-clinical-muted">Aucune configuration disponible pour ce test.</p>
      </div>
    )
  }

  const typeLabel = SCORING_TYPE_LABELS[scoringType]
  const typeColor = SCORING_TYPE_COLORS[scoringType]

  return (
    <div className="flex flex-col h-full">
      {/* Type badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColor}`}>
          {typeLabel}
        </span>
        {existingConfig && (
          <span className="text-xs text-clinical-muted">
            Version {existingConfig.version} · {new Date(existingConfig.updated_at).toLocaleDateString('fr-FR')}
          </span>
        )}
        {!existingConfig && (
          <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
            Données de référence — non sauvegardées
          </span>
        )}
      </div>

      {/* Specialized panel */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {scoringType === 'partial' && (
          <PartialScoringPanel
            testId={testId}
            config={resolvedConfig as never}
                        onSaved={onSaved}
          />
        )}
        {scoringType === 'dichotomic' && (
          <DichotomicPanel
            testId={testId}
            config={resolvedConfig as never}
                        onSaved={onSaved}
          />
        )}
        {scoringType === 'time_bonus' && (
          <TimeBonusPanel
            testId={testId}
            config={resolvedConfig as never}
                        onSaved={onSaved}
          />
        )}
        {scoringType === 'span' && (
          <DigitSpanPanel
            testId={testId}
            config={resolvedConfig as never}
                        onSaved={onSaved}
          />
        )}
        {scoringType === 'speed' && (
          <SpeedPanel
            testId={testId}
            config={resolvedConfig as never}
                        onSaved={onSaved}
          />
        )}
      </div>
    </div>
  )
}
