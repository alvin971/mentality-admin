// src/pages/NormativePage.tsx
// Éditeur des tables normatives WAIS-IV par groupe d'âge

import { useState, useEffect, useRef } from 'react'
import { Layout } from '@/components/Layout'
import {
  normativeService,
  NormativeEntry,
  AGE_GROUPS,
  WAIS_TEST_IDS,
} from '@/services/normative.service'
import { analyzeNormativeData } from '@/services/claude.service'
import { auditService } from '@/services/audit.service'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export function NormativePage() {
  const [selectedTest, setSelectedTest] = useState(WAIS_TEST_IDS[0])
  const [selectedAgeGroup, setSelectedAgeGroup] = useState(AGE_GROUPS[4]) // 20-24
  const [entries, setEntries] = useState<NormativeEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [aiAnalysis, setAiAnalysis] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [csvMode, setCsvMode] = useState(false)
  const [csvText, setCsvText] = useState('')
  const [editingRow, setEditingRow] = useState<number | null>(null)
  const [dirty, setDirty] = useState(false)
  const csvRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    loadEntries()
  }, [selectedTest, selectedAgeGroup])

  async function loadEntries() {
    setLoading(true)
    setAiAnalysis('')
    try {
      const data = await normativeService.list(selectedTest, selectedAgeGroup)
      setEntries(data)
      setErrors(normativeService.validate(data))
    } catch (e: any) {
      console.error(e)
    } finally {
      setLoading(false)
      setDirty(false)
    }
  }

  async function handleSave() {
    const validationErrors = normativeService.validate(entries)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setSaving(true)
    try {
      const old = await normativeService.list(selectedTest, selectedAgeGroup)
      await normativeService.bulkUpsert(entries)
      await auditService.log({
        tableName: 'normative_tables',
        changeType: 'update',
        oldValue: old,
        newValue: entries,
      })
      setDirty(false)
      setErrors([])
    } catch (e: any) {
      setErrors([e.message])
    } finally {
      setSaving(false)
    }
  }

  function handleCellChange(index: number, field: keyof NormativeEntry, value: string) {
    const updated = [...entries]
    ;(updated[index] as any)[field] = parseInt(value) || 0
    setEntries(updated)
    setErrors(normativeService.validate(updated))
    setDirty(true)
  }

  function handleAddRow() {
    const last = entries[entries.length - 1]
    const newEntry: NormativeEntry = {
      test_id: selectedTest,
      age_group: selectedAgeGroup,
      raw_score: last ? last.raw_score + 1 : 0,
      scaled_score: last ? Math.min(last.scaled_score + 1, 19) : 1,
      percentile: last ? Math.min(last.percentile + 5, 99) : 1,
    }
    setEntries([...entries, newEntry])
    setDirty(true)
  }

  function handleDeleteRow(index: number) {
    const updated = entries.filter((_, i) => i !== index)
    setEntries(updated)
    setErrors(normativeService.validate(updated))
    setDirty(true)
  }

  function handleImportCsv() {
    try {
      const parsed = normativeService.parseCsv(csvText, selectedTest, selectedAgeGroup)
      if (parsed.length === 0) {
        setErrors(['Aucune donnée valide trouvée dans le CSV'])
        return
      }
      setEntries(parsed)
      setErrors(normativeService.validate(parsed))
      setDirty(true)
      setCsvMode(false)
      setCsvText('')
    } catch (e: any) {
      setErrors([`Erreur CSV : ${e.message}`])
    }
  }

  function handleExportCsv() {
    const csv = normativeService.toCsv(entries)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `normes_${selectedTest}_${selectedAgeGroup}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleAiAnalysis() {
    if (entries.length === 0) return
    setAiLoading(true)
    setAiAnalysis('')
    try {
      const result = await analyzeNormativeData(selectedTest, selectedAgeGroup, entries)
      setAiAnalysis(result)
    } catch (e: any) {
      setAiAnalysis(`Erreur : ${e.message}`)
    } finally {
      setAiLoading(false)
    }
  }

  const chartData = entries.map(e => ({
    raw: e.raw_score,
    normalisé: e.scaled_score,
    percentile: e.percentile / 5, // Normaliser pour affichage conjoint
  }))

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-clinical-text">Tables Normatives</h1>
            <p className="text-sm text-clinical-muted mt-0.5">
              Éditeur des tables de conversion score brut → score normalisé par groupe d'âge
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportCsv}
              disabled={entries.length === 0}
              className="px-3 py-2 text-sm border border-clinical-border rounded-lg text-clinical-subtle hover:text-clinical-text hover:bg-gray-50 disabled:opacity-40"
            >
              Export CSV
            </button>
            <button
              onClick={() => setCsvMode(true)}
              className="px-3 py-2 text-sm border border-clinical-border rounded-lg text-clinical-subtle hover:text-clinical-text hover:bg-gray-50"
            >
              Import CSV
            </button>
            <button
              onClick={handleSave}
              disabled={!dirty || saving || errors.length > 0}
              className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-40 font-medium"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>

        {/* Sélecteurs */}
        <div className="flex gap-4 flex-wrap">
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
          <div>
            <label className="block text-xs font-medium text-clinical-muted mb-1">Groupe d'âge</label>
            <select
              value={selectedAgeGroup}
              onChange={e => setSelectedAgeGroup(e.target.value)}
              className="px-3 py-2 text-sm border border-clinical-border rounded-lg bg-white"
            >
              {AGE_GROUPS.map(g => (
                <option key={g} value={g}>{g} ans</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleAiAnalysis}
              disabled={aiLoading || entries.length === 0}
              className="px-3 py-2 text-sm bg-violet-50 border border-violet-200 text-violet-700 rounded-lg hover:bg-violet-100 disabled:opacity-40 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              {aiLoading ? 'Analyse...' : 'Analyse IA'}
            </button>
          </div>
        </div>

        {/* Erreurs de validation */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-medium text-red-800 mb-2">Problèmes détectés :</p>
            <ul className="text-sm text-red-700 space-y-1">
              {errors.map((e, i) => <li key={i}>• {e}</li>)}
            </ul>
          </div>
        )}

        {/* Analyse IA */}
        {aiAnalysis && (
          <div className="bg-violet-50 border border-violet-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="text-sm font-medium text-violet-800">Analyse IA — {selectedTest} / {selectedAgeGroup} ans</span>
              <button onClick={() => setAiAnalysis('')} className="ml-auto text-violet-400 hover:text-violet-600">✕</button>
            </div>
            <pre className="text-xs text-violet-700 whitespace-pre-wrap font-mono">{aiAnalysis}</pre>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Tableau d'édition */}
          <div className="bg-white border border-clinical-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-clinical-border flex items-center justify-between">
              <h2 className="text-sm font-semibold text-clinical-text">
                {selectedTest} — {selectedAgeGroup} ans
                <span className="ml-2 text-clinical-muted font-normal">({entries.length} entrées)</span>
              </h2>
              <button
                onClick={handleAddRow}
                className="text-xs px-2 py-1 bg-brand-50 text-brand-700 rounded hover:bg-brand-100"
              >
                + Ligne
              </button>
            </div>

            {loading ? (
              <div className="p-8 text-center text-clinical-muted text-sm">Chargement...</div>
            ) : (
              <div className="overflow-auto max-h-96">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 border-b border-clinical-border">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-clinical-muted">Score brut</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-clinical-muted">Normalisé (1-19)</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-clinical-muted">Percentile</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry, i) => (
                      <tr
                        key={i}
                        className={`border-b border-clinical-border/50 hover:bg-gray-50 ${editingRow === i ? 'bg-brand-50' : ''}`}
                        onClick={() => setEditingRow(i)}
                      >
                        <td className="px-3 py-1.5">
                          {editingRow === i ? (
                            <input
                              type="number"
                              value={entry.raw_score}
                              onChange={e => handleCellChange(i, 'raw_score', e.target.value)}
                              className="w-16 px-1 py-0.5 border border-brand-300 rounded text-sm"
                            />
                          ) : (
                            <span className="font-mono">{entry.raw_score}</span>
                          )}
                        </td>
                        <td className="px-3 py-1.5">
                          {editingRow === i ? (
                            <input
                              type="number"
                              min={1} max={19}
                              value={entry.scaled_score}
                              onChange={e => handleCellChange(i, 'scaled_score', e.target.value)}
                              className="w-16 px-1 py-0.5 border border-brand-300 rounded text-sm"
                            />
                          ) : (
                            <span className={`font-mono font-medium ${entry.scaled_score === 10 ? 'text-green-700' : entry.scaled_score < 7 ? 'text-red-600' : entry.scaled_score > 13 ? 'text-blue-600' : 'text-clinical-text'}`}>
                              {entry.scaled_score}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-1.5">
                          {editingRow === i ? (
                            <input
                              type="number"
                              min={1} max={99}
                              value={entry.percentile}
                              onChange={e => handleCellChange(i, 'percentile', e.target.value)}
                              className="w-16 px-1 py-0.5 border border-brand-300 rounded text-sm"
                            />
                          ) : (
                            <span className="font-mono text-clinical-muted">{entry.percentile}e</span>
                          )}
                        </td>
                        <td className="px-3 py-1.5">
                          <button
                            onClick={e => { e.stopPropagation(); handleDeleteRow(i) }}
                            className="text-red-400 hover:text-red-600 text-xs"
                          >✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Graphique */}
          <div className="bg-white border border-clinical-border rounded-xl p-4">
            <h2 className="text-sm font-semibold text-clinical-text mb-4">Courbe de conversion</h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="raw" label={{ value: 'Score brut', position: 'insideBottom', offset: -5 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="normalisé" stroke="#4f46e5" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="percentile" stroke="#10b981" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-clinical-muted text-sm">
                Aucune donnée pour ce groupe
              </div>
            )}
            <p className="text-xs text-clinical-muted mt-2">
              Normalisé (bleu) — Percentile ÷ 5 (vert, mis à l'échelle pour affichage)
            </p>
          </div>
        </div>

        {/* Import CSV */}
        {csvMode && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-clinical-text">Import CSV</h3>
                <button onClick={() => setCsvMode(false)} className="text-clinical-muted hover:text-clinical-text">✕</button>
              </div>
              <p className="text-sm text-clinical-muted">
                Format attendu : <code className="bg-gray-100 px-1 rounded text-xs">raw_score,scaled_score,percentile</code>
                <br />Une ligne d'en-tête optionnelle est ignorée.
              </p>
              <textarea
                ref={csvRef}
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
                placeholder={`raw_score,scaled_score,percentile\n0,1,1\n4,4,2\n8,6,9\n12,8,25\n16,10,50`}
                className="w-full h-48 text-sm font-mono border border-clinical-border rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => setCsvMode(false)} className="px-3 py-2 text-sm border border-clinical-border rounded-lg text-clinical-subtle hover:text-clinical-text">
                  Annuler
                </button>
                <button
                  onClick={handleImportCsv}
                  disabled={!csvText.trim()}
                  className="px-4 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-40"
                >
                  Importer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
