// src/pages/AnalyticsPage.tsx
import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { supabase } from '@/lib/supabase'
import { WAIS_TESTS } from '@/types'
import { AGE_GROUPS } from '@/services/normative.service'

interface DashStats {
  configuredTests: number
  waisItemsCount: number
  normativeGroupsCovered: number
  recentChanges: number
}

interface NormativeCoverage {
  test: string
  covered: number
  total: number
}

interface IRTDistribution {
  test: string
  avgA: number
  avgB: number
  count: number
}

export function AnalyticsPage() {
  const [stats, setStats] = useState<DashStats>({
    configuredTests: 0,
    waisItemsCount: 0,
    normativeGroupsCovered: 0,
    recentChanges: 0,
  })
  const [normCoverage, setNormCoverage] = useState<NormativeCoverage[]>([])
  const [irtDist, setIrtDist] = useState<IRTDistribution[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'coverage' | 'irt' | 'audit' | 'normes'>('coverage')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [
        { count: configuredTests },
        { data: waisItems },
        { data: normEntries },
        { count: recentChanges },
      ] = await Promise.all([
        supabase.from('test_configurations').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('wais_items').select('test_id, irt_a, irt_b').eq('is_active', true),
        supabase.from('normative_tables').select('test_id, age_group'),
        supabase.from('change_log').select('*', { count: 'exact', head: true })
          .gte('changed_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
      ])

      // Stats globales
      const waisItemsCount = waisItems?.length ?? 0
      const normGroups = new Set(normEntries?.map(e => `${e.test_id}|${e.age_group}`) ?? [])
      setStats({
        configuredTests: configuredTests ?? 0,
        waisItemsCount,
        normativeGroupsCovered: normGroups.size,
        recentChanges: recentChanges ?? 0,
      })

      // Couverture normative par test
      const coverageMap: Record<string, Set<string>> = {}
      for (const e of normEntries ?? []) {
        if (!coverageMap[e.test_id]) coverageMap[e.test_id] = new Set()
        coverageMap[e.test_id].add(e.age_group)
      }
      setNormCoverage(WAIS_TESTS.map(t => ({
        test: t.name.length > 10 ? t.name.slice(0, 10) + '…' : t.name,
        covered: coverageMap[t.id]?.size ?? 0,
        total: AGE_GROUPS.length,
      })))

      // Distribution IRT par test
      const irtMap: Record<string, { sumA: number; sumB: number; count: number }> = {}
      for (const item of waisItems ?? []) {
        if (!irtMap[item.test_id]) irtMap[item.test_id] = { sumA: 0, sumB: 0, count: 0 }
        irtMap[item.test_id].sumA += item.irt_a
        irtMap[item.test_id].sumB += item.irt_b
        irtMap[item.test_id].count++
      }
      setIrtDist(Object.entries(irtMap).map(([testId, d]) => {
        const t = WAIS_TESTS.find(t => t.id === testId)
        return {
          test: (t?.name ?? testId).slice(0, 10),
          avgA: Math.round((d.sumA / d.count) * 100) / 100,
          avgB: Math.round((d.sumB / d.count) * 100) / 100,
          count: d.count,
        }
      }))

    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex justify-center pt-16"><Spinner size="lg" /></div>

  const TABS = [
    { key: 'coverage', label: 'Couverture normative' },
    { key: 'irt',      label: 'Paramètres IRT' },
    { key: 'audit',    label: 'Activité admin' },
    { key: 'normes',   label: 'Comparaison normes' },
  ] as const

  return (
    <div className="space-y-5 max-w-5xl">
      {/* KPIs — données réelles Supabase */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card padding="md">
          <p className="text-xs text-clinical-muted uppercase font-medium tracking-wide">Tests configurés</p>
          <p className="text-3xl font-bold text-clinical-text mt-1">{stats.configuredTests}<span className="text-lg font-normal text-clinical-muted">/12</span></p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-clinical-muted uppercase font-medium tracking-wide">Items WAIS chargés</p>
          <p className="text-3xl font-bold text-clinical-text mt-1">{stats.waisItemsCount}</p>
          <p className="text-xs text-clinical-muted mt-1">avec paramètres IRT</p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-clinical-muted uppercase font-medium tracking-wide">Groupes normatifs</p>
          <p className="text-3xl font-bold text-clinical-text mt-1">{stats.normativeGroupsCovered}<span className="text-lg font-normal text-clinical-muted">/{WAIS_TESTS.length * AGE_GROUPS.length}</span></p>
          <div className="mt-1 h-1 bg-gray-200 rounded-full">
            <div
              className="h-1 bg-brand-600 rounded-full"
              style={{ width: `${Math.min(100, (stats.normativeGroupsCovered / (WAIS_TESTS.length * AGE_GROUPS.length)) * 100)}%` }}
            />
          </div>
        </Card>
        <Card padding="md">
          <p className="text-xs text-clinical-muted uppercase font-medium tracking-wide">Modifications (7j)</p>
          <p className="text-3xl font-bold text-clinical-text mt-1">{stats.recentChanges}</p>
          <div className="mt-2">
            <Badge variant={stats.recentChanges > 0 ? 'green' : 'gray'}>
              {stats.recentChanges > 0 ? 'Actif' : 'Aucune modification'}
            </Badge>
          </div>
        </Card>
      </div>

      <Card padding="md">
        {/* Onglets */}
        <div className="flex border-b border-clinical-border mb-6 gap-1 flex-wrap">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.key
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-clinical-muted hover:text-clinical-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Couverture normative — données réelles */}
        {activeTab === 'coverage' && (
          <div className="space-y-4">
            <CardHeader>
              <CardTitle>Couverture des tables normatives par test</CardTitle>
              <p className="text-xs text-clinical-muted">Nombre de groupes d'âge renseignés sur {AGE_GROUPS.length} possibles</p>
            </CardHeader>
            {normCoverage.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={normCoverage.map(d => ({ ...d, missing: d.total - d.covered }))}
                  margin={{ left: -10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="test" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, AGE_GROUPS.length]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number, name: string) => [v, name === 'covered' ? 'Couverts' : 'Manquants']} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="covered" stackId="a" fill="#10b981" name="Couverts" />
                  <Bar dataKey="missing" stackId="a" fill="#e2e8f0" name="Manquants" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-clinical-muted text-center py-12">
                Aucune table normative renseignée — allez dans <strong>Tables Normatives</strong> pour les saisir.
              </p>
            )}
          </div>
        )}

        {/* Paramètres IRT — données réelles depuis wais_items */}
        {activeTab === 'irt' && (
          <div className="space-y-4">
            <CardHeader>
              <CardTitle>Distribution des paramètres IRT par test</CardTitle>
              <p className="text-xs text-clinical-muted">Moyenne de discrimination (a) et difficulté (b) par test</p>
            </CardHeader>
            {irtDist.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={irtDist} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="test" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="avgA" fill="#4f46e5" name="Discrimination moy. (a)" />
                    <Bar dataKey="avgB" fill="#10b981" name="Difficulté moy. (b)" />
                  </BarChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {irtDist.map(d => (
                    <div key={d.test} className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs font-medium text-clinical-text truncate">{d.test}</p>
                      <p className="text-xs text-clinical-muted mt-1">{d.count} items — a={d.avgA} b={d.avgB}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-clinical-muted text-center py-12">
                Aucun item WAIS chargé — allez dans <strong>IRT</strong> pour importer les items.
              </p>
            )}
          </div>
        )}

        {/* Activité admin — données réelles depuis change_log */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <CardHeader>
              <CardTitle>Activité de modification administrative</CardTitle>
              <p className="text-xs text-clinical-muted">{stats.recentChanges} modifications sur les 7 derniers jours</p>
            </CardHeader>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p>Consultez le <strong>Journal d'Audit</strong> pour voir toutes les modifications en détail, avec option de revert.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-clinical-text">{stats.recentChanges}</p>
                <p className="text-sm text-clinical-muted">modifications (7 derniers jours)</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-clinical-text">{stats.waisItemsCount}</p>
                <p className="text-sm text-clinical-muted">items WAIS actifs</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'normes' && (
          <div className="space-y-4">
            <CardHeader>
              <CardTitle>Référence normative WAIS-IV</CardTitle>
            </CardHeader>
            <p className="text-sm text-clinical-muted">
              Les tables normatives doivent être saisies manuellement depuis le manuel WAIS-IV publié.
              Utilisez la page <strong>Tables Normatives</strong> pour les importer (CSV) ou les saisir.
            </p>
            <div className="grid grid-cols-3 gap-4 text-sm">
              {[
                { label: 'Moyenne WAIS-IV', value: '10', unit: 'score normalisé' },
                { label: '50e percentile', value: '10', unit: '= score normalisé 10' },
                { label: 'Plage normale', value: '8-12', unit: 'scores normalisés' },
              ].map(card => (
                <div key={card.label} className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-clinical-text">{card.value}</p>
                  <p className="text-xs text-clinical-muted mt-1">{card.label}</p>
                  <p className="text-xs text-clinical-muted">{card.unit}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
