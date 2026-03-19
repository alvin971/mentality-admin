// src/pages/ScoreConfigPage.tsx
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { TestList } from '@/components/scoring/TestList'
import { ScoreConfigPanel } from '@/components/scoring/ScoreConfigPanel'
import { scoringService } from '@/services/scoring.service'
import type { TestConfiguration } from '@/types'

export function ScoreConfigPage() {
  const [configurations, setConfigurations] = useState<TestConfiguration[]>([])
  const [selectedTestId, setSelectedTestId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadConfigs() {
    try {
      const configs = await scoringService.getAll()
      setConfigurations(configs)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadConfigs() }, [])

  const selectedConfig = configurations.find(c => c.test_id === selectedTestId) ?? null

  if (loading) {
    return <div className="flex justify-center pt-16"><Spinner size="lg" /></div>
  }

  return (
    <div className="flex gap-5 h-[calc(100vh-8rem)]">
      {/* Sidebar tests */}
      <Card padding="sm" className="flex-shrink-0 overflow-y-auto">
        <p className="text-xs font-semibold text-clinical-muted uppercase tracking-wide px-2 mb-3">
          Tests WAIS-IV
        </p>
        <TestList
          configurations={configurations}
          selectedTestId={selectedTestId}
          onSelect={setSelectedTestId}
        />
      </Card>

      {/* Panneau configuration */}
      <Card padding="md" className="flex-1 overflow-hidden flex flex-col">
        {selectedTestId ? (
          <ScoreConfigPanel
            key={selectedTestId}
            testId={selectedTestId}
            existingConfig={selectedConfig}
            onSaved={loadConfigs}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-clinical-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-clinical-text">Sélectionnez un test</p>
            <p className="text-xs text-clinical-muted mt-1 max-w-xs">
              Cliquez sur un test dans la liste de gauche pour configurer ses règles de scoring.
            </p>
            <div className="mt-6 flex gap-4 text-xs text-clinical-muted">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Scoring configuré
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-400" />
                Formule simplifiée
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
