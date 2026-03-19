// src/components/scoring/ScoreConfigPanel.tsx
import { useState, useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { RawScoreTable } from './RawScoreTable'
import { PerformanceThresholds } from './PerformanceThresholds'
import { WAIS_TESTS } from '@/types'
import { scoringService } from '@/services/scoring.service'
import { useAuth } from '@/hooks/useAuth'
import type { TestConfiguration, TestConfigJson } from '@/types'

const configSchema = z.object({
  name: z.string().min(1),
  index: z.enum(['ICV', 'IRP', 'IMT', 'IVT']),
  discontinuation: z.number().min(0).max(20),
  items: z.array(z.object({
    item_id: z.string(),
    label: z.string().min(1),
    max_score: z.number().min(0),
    partial_score: z.number().min(0),
    keywords: z.array(z.string()),
  })),
  thresholds: z.object({
    very_low:  z.tuple([z.number(), z.number()]),
    low:       z.tuple([z.number(), z.number()]),
    average:   z.tuple([z.number(), z.number()]),
    high:      z.tuple([z.number(), z.number()]),
    very_high: z.tuple([z.number(), z.number()]),
  }),
  weight: z.number().min(0).max(3),
  notes: z.string(),
})

const TABS = ['items', 'discontinuation', 'seuils', 'poids', 'notes'] as const
type Tab = typeof TABS[number]

const TAB_LABELS: Record<Tab, string> = {
  items:         'Scores bruts',
  discontinuation: 'Discontinuation',
  seuils:        'Seuils',
  poids:         'Pondération',
  notes:         'Notes cliniques',
}

interface ScoreConfigPanelProps {
  testId: string
  existingConfig: TestConfiguration | null
  onSaved: () => void
}

export function ScoreConfigPanel({ testId, existingConfig, onSaved }: ScoreConfigPanelProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('items')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const testMeta = WAIS_TESTS.find(t => t.id === testId)

  const defaultValues: TestConfigJson = existingConfig?.config_json ?? {
    name: testMeta?.name ?? testId,
    index: testMeta?.index ?? 'ICV',
    discontinuation: 3,
    items: [],
    thresholds: {
      very_low:  [0, 5],
      low:       [6, 8],
      average:   [9, 11],
      high:      [12, 14],
      very_high: [15, 99],
    },
    weight: 1.0,
    notes: '',
  }

  const methods = useForm<TestConfigJson>({
    resolver: zodResolver(configSchema),
    defaultValues,
  })

  useEffect(() => {
    methods.reset(existingConfig?.config_json ?? defaultValues)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId, existingConfig])

  async function onSubmit(data: TestConfigJson) {
    if (!user) return
    setSaving(true)
    setSaveError(null)
    try {
      await scoringService.save(testId, data, user.id)
      onSaved()
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-clinical-text">{testMeta?.name ?? testId}</h2>
            <p className="text-xs text-clinical-muted mt-0.5">
              {existingConfig
                ? `Version ${existingConfig.version} — Dernière mise à jour : ${new Date(existingConfig.updated_at).toLocaleDateString('fr-FR')}`
                : 'Configuration non définie — formule simplifiée active'}
            </p>
          </div>
          <Button type="submit" loading={saving} size="sm">
            Sauvegarder
          </Button>
        </div>

        {saveError && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-2">
            <p className="text-sm text-red-700">{saveError}</p>
          </div>
        )}

        {/* Onglets */}
        <div className="flex border-b border-clinical-border mb-5 gap-1">
          {TABS.map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-clinical-muted hover:text-clinical-text'
              }`}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* Contenu des onglets */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'items' && <RawScoreTable />}

          {activeTab === 'discontinuation' && (
            <div className="space-y-4 max-w-sm">
              <p className="text-sm text-clinical-subtle">
                Nombre de réponses incorrectes consécutives déclenchant l'arrêt du test.
                Mettre 0 pour désactiver la règle de discontinuation.
              </p>
              <Input
                type="number"
                label="Nombre d'échecs consécutifs pour arrêt"
                min={0}
                max={20}
                {...methods.register('discontinuation', { valueAsNumber: true })}
                error={methods.formState.errors.discontinuation?.message}
              />
            </div>
          )}

          {activeTab === 'seuils' && <PerformanceThresholds />}

          {activeTab === 'poids' && (
            <div className="space-y-4 max-w-sm">
              <p className="text-sm text-clinical-subtle">
                Pondération de ce test dans le calcul de l'indice composite {testMeta?.index}.
                1.0 = poids standard, 0 = test exclu du calcul.
              </p>
              <Input
                type="number"
                label="Poids dans l'indice composite"
                min={0}
                max={3}
                step={0.1}
                {...methods.register('weight', { valueAsNumber: true })}
                error={methods.formState.errors.weight?.message}
              />
              <p className="text-xs text-clinical-muted">
                Valeur entre 0 et 3. Valeur recommandée : 1.0
              </p>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-3">
              <p className="text-sm text-clinical-subtle">
                Observations cliniques sur ce test : particularités d'interprétation,
                populations spécifiques, nuances diagnostiques, biais culturels connus.
              </p>
              <Textarea
                label="Notes cliniques"
                rows={10}
                placeholder="Ex: Ce test présente des biais culturels pour les populations peu alphabétisées. Interpréter avec prudence chez les sujets de plus de 70 ans..."
                {...methods.register('notes')}
              />
            </div>
          )}
        </div>
      </form>
    </FormProvider>
  )
}
