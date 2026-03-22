// src/pages/IRTPage.tsx
// Visualisation et édition des paramètres IRT des items WAIS-IV

import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { supabase } from '@/lib/supabase'
import { suggestIRTParams } from '@/services/claude.service'
import { auditService } from '@/services/audit.service'
import { WAIS_TEST_IDS } from '@/services/normative.service'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'

interface WaisItem {
  id: string
  test_id: string
  item_number: number
  stimulus: string
  scoring_type: string
  irt_a: number
  irt_b: number
  composite_index: string
  is_active: boolean
  notes?: string
}

// Modèle 2PL : P(θ) = 1 / (1 + exp(-a * (θ - b)))
function icc2PL(theta: number, a: number, b: number): number {
  return 1 / (1 + Math.exp(-a * (theta - b)))
}

function generateICCData(a: number, b: number) {
  const points = []
  for (let theta = -4; theta <= 4; theta += 0.2) {
    points.push({
      theta: Math.round(theta * 10) / 10,
      P: Math.round(icc2PL(theta, a, b) * 100) / 100,
    })
  }
  return points
}

export function IRTPage() {
  const [selectedTest, setSelectedTest] = useState(WAIS_TEST_IDS[0])
  const [items, setItems] = useState<WaisItem[]>([])
  const [selectedItem, setSelectedItem] = useState<WaisItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editA, setEditA] = useState('1.0')
  const [editB, setEditB] = useState('0.0')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState('')
  const [simulateTheta, setSimulateTheta] = useState(0)

  useEffect(() => {
    loadItems()
  }, [selectedTest])

  useEffect(() => {
    if (selectedItem) {
      setEditA(selectedItem.irt_a.toString())
      setEditB(selectedItem.irt_b.toString())
      setAiSuggestion('')
    }
  }, [selectedItem])

  async function loadItems() {
    setLoading(true)
    setSelectedItem(null)
    try {
      const { data, error } = await supabase
        .from('wais_items')
        .select('*')
        .eq('test_id', selectedTest)
        .eq('is_active', true)
        .order('item_number')

      if (error) throw error
      setItems(data ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveIRT() {
    if (!selectedItem) return
    setSaving(true)
    try {
      const a = parseFloat(editA)
      const b = parseFloat(editB)
      if (isNaN(a) || isNaN(b)) throw new Error('Valeurs a et b invalides')

      const { error } = await supabase
        .from('wais_items')
        .update({ irt_a: a, irt_b: b, updated_at: new Date().toISOString() })
        .eq('id', selectedItem.id)

      if (error) throw error

      await auditService.log({
        tableName: 'wais_items',
        recordId: selectedItem.id,
        changeType: 'update',
        oldValue: { irt_a: selectedItem.irt_a, irt_b: selectedItem.irt_b },
        newValue: { irt_a: a, irt_b: b },
      })

      setItems(items.map(it => it.id === selectedItem.id ? { ...it, irt_a: a, irt_b: b } : it))
      setSelectedItem(prev => prev ? { ...prev, irt_a: a, irt_b: b } : null)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleAiSuggest() {
    if (!selectedItem) return
    setAiLoading(true)
    setAiSuggestion('')
    try {
      const result = await suggestIRTParams(
        selectedItem.test_id,
        selectedItem.item_number,
        selectedItem.stimulus,
        selectedItem.notes
      )
      setAiSuggestion(`a=${result.a}, b=${result.b}\n\nRationale : ${result.rationale}`)
      setEditA(result.a.toString())
      setEditB(result.b.toString())
    } catch (e: any) {
      setAiSuggestion(`Erreur : ${e.message}`)
    } finally {
      setAiLoading(false)
    }
  }

  const previewA = parseFloat(editA) || 1.0
  const previewB = parseFloat(editB) || 0.0
  const iccData = generateICCData(previewA, previewB)
  const simulatedP = Math.round(icc2PL(simulateTheta, previewA, previewB) * 100)

  // Courbes ICC de tous les items pour comparaison
  const allCurvesData = generateICCData(1, 0).map(pt => {
    const row: Record<string, number> = { theta: pt.theta }
    items.slice(0, 8).forEach(it => {
      row[`Item ${it.item_number}`] = Math.round(icc2PL(pt.theta, it.irt_a, it.irt_b) * 100) / 100
    })
    return row
  })

  const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316']

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-clinical-text">Paramètres IRT</h1>
          <p className="text-sm text-clinical-muted mt-0.5">
            Courbes caractéristiques d'items (modèle 2PL) — discrimination (a) et difficulté (b)
          </p>
        </div>

        {/* Sélecteur de test */}
        <div className="flex gap-4 items-end flex-wrap">
          <div>
            <label className="block text-xs font-medium text-clinical-muted mb-1">Test</label>
            <select
              value={selectedTest}
              onChange={e => setSelectedTest(e.target.value)}
              className="px-3 py-2 text-sm border border-clinical-border rounded-lg bg-white"
            >
              {WAIS_TEST_IDS.map(id => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Liste des items */}
          <div className="bg-white border border-clinical-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-clinical-border">
              <h2 className="text-sm font-semibold text-clinical-text">Items ({items.length})</h2>
            </div>
            {loading ? (
              <div className="p-6 text-center text-sm text-clinical-muted">Chargement...</div>
            ) : (
              <div className="overflow-auto max-h-96">
                {items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`w-full text-left px-4 py-3 border-b border-clinical-border/50 hover:bg-gray-50 transition-colors ${selectedItem?.id === item.id ? 'bg-brand-50 border-l-2 border-l-brand-600' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-clinical-text">Item {item.item_number}</span>
                      <span className="text-xs text-clinical-muted font-mono">a={item.irt_a} b={item.irt_b}</span>
                    </div>
                    <p className="text-xs text-clinical-muted mt-0.5 truncate">{item.stimulus}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Éditeur + courbe ICC individuelle */}
          <div className="space-y-4">
            {selectedItem ? (
              <>
                <div className="bg-white border border-clinical-border rounded-xl p-4 space-y-4">
                  <h2 className="text-sm font-semibold text-clinical-text">
                    Item {selectedItem.item_number} — {selectedItem.stimulus.slice(0, 40)}...
                  </h2>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-clinical-muted mb-1">
                        a — Discrimination
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="3"
                        value={editA}
                        onChange={e => setEditA(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-clinical-border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                      <p className="text-xs text-clinical-muted mt-1">Pente de la courbe (0.5–2.5)</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-clinical-muted mb-1">
                        b — Difficulté (logit)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="-4"
                        max="4"
                        value={editB}
                        onChange={e => setEditB(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-clinical-border rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                      <p className="text-xs text-clinical-muted mt-1">Point d'inflexion (-3 à +3)</p>
                    </div>
                  </div>

                  {/* Simulation theta */}
                  <div>
                    <label className="block text-xs font-medium text-clinical-muted mb-1">
                      Simuler θ = {simulateTheta} → P(réussite) = {simulatedP}%
                    </label>
                    <input
                      type="range"
                      min="-4" max="4" step="0.5"
                      value={simulateTheta}
                      onChange={e => setSimulateTheta(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-clinical-muted">
                      <span>θ = -4 (très faible)</span>
                      <span>θ = +4 (très élevé)</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleAiSuggest}
                      disabled={aiLoading}
                      className="flex-1 px-3 py-2 text-sm bg-violet-50 border border-violet-200 text-violet-700 rounded-lg hover:bg-violet-100 disabled:opacity-40"
                    >
                      {aiLoading ? '...' : '✦ Suggestion IA'}
                    </button>
                    <button
                      onClick={handleSaveIRT}
                      disabled={saving}
                      className="flex-1 px-3 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-40 font-medium"
                    >
                      {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                    </button>
                  </div>

                  {aiSuggestion && (
                    <div className="bg-violet-50 border border-violet-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-violet-800 mb-1">Suggestion IA :</p>
                      <pre className="text-xs text-violet-700 whitespace-pre-wrap">{aiSuggestion}</pre>
                    </div>
                  )}
                </div>

                {/* Courbe ICC de l'item sélectionné */}
                <div className="bg-white border border-clinical-border rounded-xl p-4">
                  <h3 className="text-sm font-semibold text-clinical-text mb-3">
                    Courbe ICC — Item {selectedItem.item_number}
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={iccData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="theta" label={{ value: 'θ (aptitude)', position: 'insideBottom', offset: -5 }} />
                      <YAxis domain={[0, 1]} tickFormatter={v => `${Math.round(v * 100)}%`} />
                      <Tooltip formatter={(v: number) => `${Math.round(v * 100)}%`} />
                      <ReferenceLine x={previewB} stroke="#ef4444" strokeDasharray="4 2" label={{ value: 'b', fill: '#ef4444', fontSize: 12 }} />
                      <ReferenceLine x={simulateTheta} stroke="#10b981" strokeDasharray="2 2" />
                      <Line type="monotone" dataKey="P" stroke="#4f46e5" strokeWidth={2} dot={false} name="P(réussite)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <div className="bg-white border border-clinical-border rounded-xl p-8 text-center text-sm text-clinical-muted">
                Sélectionnez un item pour voir et modifier ses paramètres IRT
              </div>
            )}
          </div>

          {/* Courbes ICC comparatives */}
          <div className="bg-white border border-clinical-border rounded-xl p-4">
            <h2 className="text-sm font-semibold text-clinical-text mb-3">
              Comparaison — {Math.min(items.length, 8)} premiers items
            </h2>
            {items.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={allCurvesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="theta" />
                  <YAxis domain={[0, 1]} tickFormatter={v => `${Math.round(v * 100)}%`} />
                  <Tooltip formatter={(v: number) => `${Math.round(v * 100)}%`} />
                  <Legend />
                  {items.slice(0, 8).map((item, i) => (
                    <Line
                      key={item.id}
                      type="monotone"
                      dataKey={`Item ${item.item_number}`}
                      stroke={COLORS[i % COLORS.length]}
                      strokeWidth={1.5}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-clinical-muted text-sm">
                {loading ? 'Chargement...' : 'Aucun item pour ce test'}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
