// src/pages/AuditPage.tsx
// Journal d'audit complet de toutes les modifications admin

import { useState, useEffect } from 'react'
import { Layout } from '@/components/Layout'
import { auditService, ChangeLogEntry, ChangeLogFilter } from '@/services/audit.service'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  deployed:  { label: 'Déployé',  color: 'bg-green-100 text-green-800' },
  approved:  { label: 'Approuvé', color: 'bg-blue-100 text-blue-800' },
  draft:     { label: 'Brouillon', color: 'bg-gray-100 text-gray-700' },
  reverted:  { label: 'Annulé',   color: 'bg-red-100 text-red-800' },
}

const CHANGE_TYPE_ICONS: Record<string, string> = {
  create:   '✚',
  update:   '✎',
  delete:   '✕',
  rollback: '↩',
  deploy:   '🚀',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AuditPage() {
  const [entries, setEntries] = useState<ChangeLogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<ChangeLogEntry | null>(null)
  const [reverting, setReverting] = useState(false)
  const [filter, setFilter] = useState<ChangeLogFilter>({ limit: 50 })
  const [tableCounts, setTableCounts] = useState<Array<{ table_name: string; count: number }>>([])

  useEffect(() => {
    loadEntries()
    loadTableCounts()
  }, [filter])

  async function loadEntries() {
    setLoading(true)
    try {
      const data = await auditService.list(filter)
      setEntries(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function loadTableCounts() {
    try {
      const counts = await auditService.countByTable()
      setTableCounts(counts)
    } catch {}
  }

  async function handleRevert(entry: ChangeLogEntry) {
    if (!entry.old_value) {
      alert('Impossible de reverter : aucune valeur précédente enregistrée')
      return
    }
    if (!confirm(`Reverter ce changement sur ${entry.table_name} ? L'ancienne valeur sera restaurée.`)) return

    setReverting(true)
    try {
      await auditService.revert(entry)
      await loadEntries()
      setSelected(null)
    } catch (e: any) {
      alert(`Erreur lors du revert : ${e.message}`)
    } finally {
      setReverting(false)
    }
  }

  const tables = [...new Set(entries.map(e => e.table_name))]

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-clinical-text">Journal d'Audit</h1>
          <p className="text-sm text-clinical-muted mt-0.5">
            Historique complet de toutes les modifications effectuées par les administrateurs
          </p>
        </div>

        {/* KPIs par table */}
        {tableCounts.length > 0 && (
          <div className="flex gap-3 flex-wrap">
            {tableCounts.slice(0, 5).map(tc => (
              <button
                key={tc.table_name}
                onClick={() => setFilter(f => ({ ...f, tableName: tc.table_name === filter.tableName ? undefined : tc.table_name }))}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${filter.tableName === tc.table_name ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-clinical-text border-clinical-border hover:bg-gray-50'}`}
              >
                {tc.table_name} <span className="opacity-70">({tc.count})</span>
              </button>
            ))}
            {filter.tableName && (
              <button
                onClick={() => setFilter(f => ({ ...f, tableName: undefined }))}
                className="px-3 py-1.5 text-sm rounded-full border border-clinical-border text-clinical-muted hover:text-clinical-text"
              >
                ✕ Réinitialiser
              </button>
            )}
          </div>
        )}

        {/* Filtres */}
        <div className="flex gap-3 flex-wrap">
          <select
            value={filter.status ?? ''}
            onChange={e => setFilter(f => ({ ...f, status: e.target.value || undefined }))}
            className="px-3 py-2 text-sm border border-clinical-border rounded-lg bg-white"
          >
            <option value="">Tous les statuts</option>
            {Object.entries(STATUS_LABELS).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            value={filter.tableName ?? ''}
            onChange={e => setFilter(f => ({ ...f, tableName: e.target.value || undefined }))}
            className="px-3 py-2 text-sm border border-clinical-border rounded-lg bg-white"
          >
            <option value="">Toutes les tables</option>
            {tables.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={filter.limit ?? 50}
            onChange={e => setFilter(f => ({ ...f, limit: parseInt(e.target.value) }))}
            className="px-3 py-2 text-sm border border-clinical-border rounded-lg bg-white"
          >
            <option value={20}>20 entrées</option>
            <option value={50}>50 entrées</option>
            <option value={100}>100 entrées</option>
            <option value={200}>200 entrées</option>
          </select>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Timeline */}
          <div className="xl:col-span-2 bg-white border border-clinical-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-clinical-border">
              <h2 className="text-sm font-semibold text-clinical-text">
                Timeline ({entries.length} entrées)
              </h2>
            </div>
            {loading ? (
              <div className="p-8 text-center text-sm text-clinical-muted">Chargement...</div>
            ) : entries.length === 0 ? (
              <div className="p-8 text-center text-sm text-clinical-muted">
                Aucune modification enregistrée
              </div>
            ) : (
              <div className="divide-y divide-clinical-border/50">
                {entries.map(entry => {
                  const status = STATUS_LABELS[entry.status] ?? { label: entry.status, color: 'bg-gray-100 text-gray-700' }
                  return (
                    <button
                      key={entry.id}
                      onClick={() => setSelected(entry)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${selected?.id === entry.id ? 'bg-brand-50 border-l-2 border-l-brand-600' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-lg mt-0.5 flex-shrink-0" title={entry.change_type}>
                          {CHANGE_TYPE_ICONS[entry.change_type] ?? '•'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-clinical-text">{entry.table_name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
                              {status.label}
                            </span>
                            {entry.ai_suggested && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">
                                ✦ IA
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-clinical-muted">{formatDate(entry.changed_at)}</span>
                            {entry.changer_name && (
                              <span className="text-xs text-clinical-muted">— {entry.changer_name}</span>
                            )}
                          </div>
                          {entry.record_id && (
                            <p className="text-xs text-clinical-muted font-mono truncate mt-0.5">
                              id: {entry.record_id}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Détail du changement sélectionné */}
          <div className="space-y-4">
            {selected ? (
              <div className="bg-white border border-clinical-border rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-clinical-text">Détail</h2>
                  <button onClick={() => setSelected(null)} className="text-clinical-muted hover:text-clinical-text text-sm">✕</button>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-clinical-muted">Table</span>
                    <span className="font-medium text-clinical-text font-mono">{selected.table_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-clinical-muted">Action</span>
                    <span className="font-medium text-clinical-text capitalize">{selected.change_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-clinical-muted">Date</span>
                    <span className="text-clinical-text text-xs">{formatDate(selected.changed_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-clinical-muted">Auteur</span>
                    <span className="text-clinical-text">{selected.changer_name ?? 'Inconnu'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-clinical-muted">Statut</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_LABELS[selected.status]?.color ?? ''}`}>
                      {STATUS_LABELS[selected.status]?.label ?? selected.status}
                    </span>
                  </div>
                </div>

                {selected.old_value !== null && selected.old_value !== undefined && (
                  <div>
                    <p className="text-xs font-medium text-red-700 mb-1">Ancienne valeur :</p>
                    <pre className="text-xs bg-red-50 border border-red-100 rounded p-2 overflow-auto max-h-32 font-mono">
                      {JSON.stringify(selected.old_value as object, null, 2)}
                    </pre>
                  </div>
                )}

                {selected.new_value !== null && selected.new_value !== undefined && (
                  <div>
                    <p className="text-xs font-medium text-green-700 mb-1">Nouvelle valeur :</p>
                    <pre className="text-xs bg-green-50 border border-green-100 rounded p-2 overflow-auto max-h-32 font-mono">
                      {JSON.stringify(selected.new_value as object, null, 2)}
                    </pre>
                  </div>
                )}

                {selected.change_type !== 'rollback' && selected.change_type !== 'delete' && selected.status !== 'reverted' && (
                  <button
                    onClick={() => handleRevert(selected)}
                    disabled={reverting || !selected.old_value}
                    className="w-full px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-40"
                  >
                    {reverting ? 'Annulation en cours...' : '↩ Annuler ce changement'}
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white border border-clinical-border rounded-xl p-6 text-center text-sm text-clinical-muted">
                Sélectionnez une entrée pour voir les détails et options de revert
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
