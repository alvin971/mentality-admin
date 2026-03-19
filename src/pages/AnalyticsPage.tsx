// src/pages/AnalyticsPage.tsx
import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, ScatterChart, Scatter,
} from 'recharts'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { supabase } from '@/lib/supabase'
import { WAIS_TESTS } from '@/types'

// Données de démonstration — remplacer par des requêtes Supabase agrégées
const DEMO_DISTRIBUTION = WAIS_TESTS.map(t => ({
  name: t.name.length > 10 ? t.name.slice(0, 10) + '…' : t.name,
  très_faible: Math.floor(Math.random() * 15) + 5,
  faible:      Math.floor(Math.random() * 20) + 10,
  moyen:       Math.floor(Math.random() * 30) + 30,
  élevé:       Math.floor(Math.random() * 20) + 10,
  très_élevé:  Math.floor(Math.random() * 15) + 5,
}))

const DEMO_RELIABILITY = WAIS_TESTS.slice(0, 6).map(t => ({
  test: t.name.length > 10 ? t.name.slice(0, 10) + '…' : t.name,
  réussite:  Math.floor(Math.random() * 40) + 40,
  partiel:   Math.floor(Math.random() * 20) + 10,
  échec:     Math.floor(Math.random() * 20) + 5,
}))

const DEMO_NORM_COMPARISON = Array.from({ length: 12 }, (_, i) => ({
  test: WAIS_TESTS[i]?.name.slice(0, 8) ?? `T${i}`,
  mentality: Math.floor(Math.random() * 30) + 85,
  wais_iv:   100,
}))

interface DashStats {
  totalSessions: number
  avgCompletionRate: number
  configuredTests: number
}

export function AnalyticsPage() {
  const [stats, setStats] = useState<DashStats>({ totalSessions: 0, avgCompletionRate: 0, configuredTests: 0 })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'distribution' | 'fiabilite' | 'discontinuation' | 'normes'>('distribution')

  useEffect(() => {
    Promise.all([
      supabase.from('test_configurations').select('*', { count: 'exact', head: true }).eq('is_active', true),
    ]).then(([{ count }]) => {
      setStats({ totalSessions: 0, avgCompletionRate: 0, configuredTests: count ?? 0 })
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center pt-16"><Spinner size="lg" /></div>

  const TABS = [
    { key: 'distribution',   label: 'Distribution des scores' },
    { key: 'fiabilite',      label: 'Fiabilité des items' },
    { key: 'discontinuation',label: 'Discontinuations' },
    { key: 'normes',         label: 'Comparaison normes' },
  ] as const

  return (
    <div className="space-y-5 max-w-5xl">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <Card padding="md">
          <p className="text-xs text-clinical-muted uppercase font-medium tracking-wide">Tests configurés</p>
          <p className="text-3xl font-bold text-clinical-text mt-1">{stats.configuredTests}<span className="text-lg font-normal text-clinical-muted">/12</span></p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-clinical-muted uppercase font-medium tracking-wide">Sessions analysées</p>
          <p className="text-3xl font-bold text-clinical-text mt-1">{stats.totalSessions}</p>
          <p className="text-xs text-clinical-muted mt-1">Données anonymisées</p>
        </Card>
        <Card padding="md">
          <p className="text-xs text-clinical-muted uppercase font-medium tracking-wide">Données disponibles</p>
          <div className="mt-2">
            <Badge variant={stats.configuredTests > 0 ? 'green' : 'orange'}>
              {stats.configuredTests > 0 ? 'Actif' : 'En attente de données'}
            </Badge>
          </div>
        </Card>
      </div>

      <Card padding="md">
        {/* Onglets */}
        <div className="flex border-b border-clinical-border mb-6 gap-1">
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

        {activeTab === 'distribution' && (
          <div className="space-y-4">
            <CardHeader>
              <CardTitle>Distribution des scores bruts par test</CardTitle>
              <p className="text-xs text-clinical-muted">Données anonymisées — pas d'identifiants personnels</p>
            </CardHeader>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={DEMO_DISTRIBUTION} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="très_faible" stackId="a" fill="#ef4444" />
                <Bar dataKey="faible"      stackId="a" fill="#f97316" />
                <Bar dataKey="moyen"       stackId="a" fill="#eab308" />
                <Bar dataKey="élevé"       stackId="a" fill="#3b82f6" />
                <Bar dataKey="très_élevé"  stackId="a" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'fiabilite' && (
          <div className="space-y-4">
            <CardHeader>
              <CardTitle>Taux de réussite / réponse partielle / échec par test</CardTitle>
            </CardHeader>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={DEMO_RELIABILITY} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="test" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={(v: number) => `${v}%`} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="réussite" stackId="a" fill="#10b981" />
                <Bar dataKey="partiel"  stackId="a" fill="#f59e0b" />
                <Bar dataKey="échec"    stackId="a" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'discontinuation' && (
          <div className="space-y-4">
            <CardHeader>
              <CardTitle>Analyse des discontinuations</CardTitle>
            </CardHeader>
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" dataKey="x" name="Item #" tick={{ fontSize: 11 }} />
                <YAxis type="number" dataKey="y" name="Taux discontinuation %" unit="%" tick={{ fontSize: 11 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter
                  name="Discontinuations"
                  data={Array.from({ length: 20 }, (_, i) => ({ x: i + 1, y: Math.random() * 40 }))}
                  fill="#3a5bff"
                />
              </ScatterChart>
            </ResponsiveContainer>
            <p className="text-xs text-clinical-muted">
              Items avec un taux de discontinuation élevé peuvent être mal calibrés ou trop difficiles.
            </p>
          </div>
        )}

        {activeTab === 'normes' && (
          <div className="space-y-4">
            <CardHeader>
              <CardTitle>Comparaison avec les normes WAIS-IV publiées</CardTitle>
            </CardHeader>
            <p className="text-sm text-clinical-subtle mb-3">
              Scores scalés Mentality vs normes WAIS-IV officielles (moyenne population générale = 100).
              Valeurs de référence issues de la littérature scientifique publiée.
            </p>
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={DEMO_NORM_COMPARISON} margin={{ left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="test" tick={{ fontSize: 11 }} />
                <YAxis domain={[60, 140]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="mentality" stroke="#3a5bff" strokeWidth={2} dot={{ r: 4 }} name="Mentality" />
                <Line type="monotone" dataKey="wais_iv" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Norme WAIS-IV" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  )
}
