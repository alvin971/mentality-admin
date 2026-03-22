// src/pages/ItemsLibraryPage.tsx
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { Table, TableHead, TableBody, Th, Td, Tr } from '@/components/ui/Table'
import { Spinner } from '@/components/ui/Spinner'
import { itemsService } from '@/services/items.service'
import { useAuth } from '@/hooks/useAuth'
import { WAIS_TESTS } from '@/types'
import type { ItemLibrary, ItemStatus } from '@/types'
import { supabase } from '@/lib/supabase'
import { getItemSuggestions } from '@/services/claude.service'
import { auditService } from '@/services/audit.service'

interface WaisItem {
  id: string
  test_id: string
  item_number: number
  stimulus: string
  scoring_type: string
  expected_responses: Array<{ answer: string; score: number }>
  irt_a: number
  irt_b: number
  composite_index: string
  notes?: string
}

const itemSchema = z.object({
  test_id:          z.string().min(1, 'Sélectionnez un test'),
  item_type:        z.enum(['verbal', 'nonverbal', 'numerical', 'spatial']),
  prompt:           z.string().min(1, 'Le contenu est requis'),
  expected_score:   z.number().min(0).max(4),
  difficulty_level: z.number().min(1).max(5),
  tags:             z.string(),
  region:           z.string(),
  cultural_notes:   z.string(),
})
type ItemForm = z.infer<typeof itemSchema>

const STATUS_VARIANTS: Record<ItemStatus, 'green' | 'orange' | 'gray'> = {
  active:   'green',
  review:   'orange',
  archived: 'gray',
}

const STATUS_LABELS: Record<ItemStatus, string> = {
  active:   'Actif',
  review:   'En révision',
  archived: 'Archivé',
}

export function ItemsLibraryPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'library' | 'wais'>('wais')
  const [items, setItems] = useState<ItemLibrary[]>([])
  const [waisItems, setWaisItems] = useState<WaisItem[]>([])
  const [selectedWaisItem, setSelectedWaisItem] = useState<WaisItem | null>(null)
  const [waisFilterTest, setWaisFilterTest] = useState('')
  const [aiSuggestion, setAiSuggestion] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [editingStimulus, setEditingStimulus] = useState('')
  const [editingNotes, setEditingNotes] = useState('')
  const [savingWais, setSavingWais] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filterTestId, setFilterTestId] = useState('')
  const [filterStatus, setFilterStatus] = useState<ItemStatus | ''>('')
  const [filterRegion, setFilterRegion] = useState('')
  const [modalOpen, setModalOpen] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ItemForm>({
    resolver: zodResolver(itemSchema),
    defaultValues: { item_type: 'verbal', difficulty_level: 3, expected_score: 2, tags: '', region: '', cultural_notes: '', prompt: '' },
  })

  async function loadItems() {
    setLoading(true)
    try {
      const data = await itemsService.list({
        testId: filterTestId || undefined,
        status: filterStatus || undefined,
        region: filterRegion || undefined,
      })
      setItems(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function loadWaisItems() {
    setLoading(true)
    try {
      let query = supabase.from('wais_items').select('*').order('test_id').order('item_number')
      if (waisFilterTest) query = query.eq('test_id', waisFilterTest)
      const { data, error } = await query
      if (error) throw error
      setWaisItems(data ?? [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadItems() }, [filterTestId, filterStatus, filterRegion]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { loadWaisItems() }, [waisFilterTest]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (selectedWaisItem) {
      setEditingStimulus(selectedWaisItem.stimulus)
      setEditingNotes(selectedWaisItem.notes ?? '')
      setAiSuggestion('')
    }
  }, [selectedWaisItem])

  async function handleAiSuggest() {
    if (!selectedWaisItem) return
    setAiLoading(true)
    setAiSuggestion('')
    try {
      const result = await getItemSuggestions({
        testId: selectedWaisItem.test_id,
        itemNumber: selectedWaisItem.item_number,
        stimulus: selectedWaisItem.stimulus,
        scoringType: selectedWaisItem.scoring_type,
        expectedResponses: selectedWaisItem.expected_responses,
        irtA: selectedWaisItem.irt_a,
        irtB: selectedWaisItem.irt_b,
      })
      setAiSuggestion(result)
    } catch (e: any) {
      setAiSuggestion(`Erreur : ${e.message}`)
    } finally {
      setAiLoading(false)
    }
  }

  async function handleSaveWaisItem() {
    if (!selectedWaisItem) return
    setSavingWais(true)
    try {
      const { error } = await supabase
        .from('wais_items')
        .update({
          stimulus: editingStimulus,
          notes: editingNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedWaisItem.id)

      if (error) throw error

      await auditService.log({
        tableName: 'wais_items',
        recordId: selectedWaisItem.id,
        changeType: 'update',
        oldValue: { stimulus: selectedWaisItem.stimulus, notes: selectedWaisItem.notes },
        newValue: { stimulus: editingStimulus, notes: editingNotes },
      })

      setWaisItems(prev => prev.map(it =>
        it.id === selectedWaisItem.id ? { ...it, stimulus: editingStimulus, notes: editingNotes } : it
      ))
      setSelectedWaisItem(prev => prev ? { ...prev, stimulus: editingStimulus, notes: editingNotes } : null)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSavingWais(false)
    }
  }

  async function onSubmit(data: ItemForm) {
    if (!user) return
    await itemsService.create({
      test_id: data.test_id,
      item_type: data.item_type,
      content_json: {
        prompt: data.prompt,
        example_answers: [],
        cultural_notes: data.cultural_notes,
      },
      expected_score: data.expected_score,
      difficulty_level: data.difficulty_level,
      tags: data.tags.split(',').map(t => t.trim()).filter(Boolean),
      region: data.region.split(',').map(r => r.trim()).filter(Boolean),
      created_by: user.id,
    })
    reset()
    setModalOpen(false)
    loadItems()
  }

  async function handleStatusChange(id: string, status: ItemStatus) {
    await itemsService.setStatus(id, status)
    loadItems()
  }

  return (
    <div className="space-y-5">
      {/* Onglets principaux */}
      <div className="flex gap-1 border-b border-clinical-border">
        <button
          onClick={() => setActiveTab('wais')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === 'wais' ? 'border-brand-600 text-brand-700' : 'border-transparent text-clinical-muted hover:text-clinical-text'}`}
        >
          Items WAIS-IV officiels
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${activeTab === 'library' ? 'border-brand-600 text-brand-700' : 'border-transparent text-clinical-muted hover:text-clinical-text'}`}
        >
          Bibliothèque alternative
        </button>
      </div>

      {/* WAIS Items Tab */}
      {activeTab === 'wais' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Liste */}
          <div className="xl:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <select
                value={waisFilterTest}
                onChange={e => setWaisFilterTest(e.target.value)}
                className="flex-1 rounded-lg border border-clinical-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Tous les tests</option>
                {WAIS_TESTS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>

            <div className="bg-white border border-clinical-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-clinical-border">
                <p className="text-sm font-semibold text-clinical-text">
                  {waisItems.length} items
                </p>
              </div>
              {loading ? (
                <div className="p-6 flex justify-center"><Spinner /></div>
              ) : waisItems.length === 0 ? (
                <p className="text-sm text-clinical-muted text-center py-8">
                  Aucun item WAIS trouvé. Exécutez la migration SQL 003.
                </p>
              ) : (
                <div className="overflow-auto max-h-96 divide-y divide-clinical-border/50">
                  {waisItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedWaisItem(item)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${selectedWaisItem?.id === item.id ? 'bg-brand-50 border-l-2 border-l-brand-600' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-clinical-muted">{item.test_id} · {item.composite_index}</span>
                        <span className="text-xs font-mono text-clinical-muted">#{item.item_number}</span>
                      </div>
                      <p className="text-sm text-clinical-text mt-0.5 truncate">{item.stimulus}</p>
                      <p className="text-xs text-clinical-muted mt-0.5">{item.scoring_type} · a={item.irt_a} b={item.irt_b}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Éditeur d'item WAIS */}
          <div className="xl:col-span-2">
            {selectedWaisItem ? (
              <div className="space-y-4">
                <div className="bg-white border border-clinical-border rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-clinical-text">
                        {selectedWaisItem.test_id} — Item {selectedWaisItem.item_number}
                      </p>
                      <p className="text-xs text-clinical-muted mt-0.5">
                        {selectedWaisItem.scoring_type} · {selectedWaisItem.composite_index} · a={selectedWaisItem.irt_a} b={selectedWaisItem.irt_b}
                      </p>
                    </div>
                    <Badge variant="green">{selectedWaisItem.composite_index}</Badge>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-clinical-muted mb-1">Stimulus (question)</label>
                      <textarea
                        value={editingStimulus}
                        onChange={e => setEditingStimulus(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-clinical-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-clinical-muted mb-1">Réponses attendues</label>
                      <div className="space-y-1">
                        {selectedWaisItem.expected_responses.map((r, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs bg-gray-50 rounded px-2 py-1">
                            <span className={`px-1.5 py-0.5 rounded font-mono font-bold ${r.score === 2 ? 'bg-green-100 text-green-800' : r.score === 1 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-200 text-gray-600'}`}>
                              {r.score}
                            </span>
                            <span className="text-clinical-text flex-1 truncate">{r.answer}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-clinical-muted mb-1">Notes cliniques</label>
                      <textarea
                        value={editingNotes}
                        onChange={e => setEditingNotes(e.target.value)}
                        rows={2}
                        placeholder="Biais culturels, difficultés spécifiques, observations..."
                        className="w-full px-3 py-2 text-sm border border-clinical-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleAiSuggest}
                      disabled={aiLoading}
                      className="flex-1 px-3 py-2 text-sm bg-violet-50 border border-violet-200 text-violet-700 rounded-lg hover:bg-violet-100 disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      {aiLoading ? 'Analyse...' : '✦ Suggestion IA'}
                    </button>
                    <button
                      onClick={handleSaveWaisItem}
                      disabled={savingWais}
                      className="flex-1 px-3 py-2 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-40 font-medium"
                    >
                      {savingWais ? 'Sauvegarde...' : 'Sauvegarder'}
                    </button>
                  </div>
                </div>

                {/* Panel suggestion IA */}
                {aiSuggestion && (
                  <div className="bg-white border border-violet-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-medium text-violet-800 bg-violet-100 px-2 py-0.5 rounded-full">✦ Analyse IA — Claude</span>
                      <button onClick={() => setAiSuggestion('')} className="ml-auto text-clinical-muted hover:text-clinical-text text-sm">✕</button>
                    </div>
                    <pre className="text-xs text-clinical-text whitespace-pre-wrap font-mono overflow-auto max-h-64">{aiSuggestion}</pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border border-clinical-border rounded-xl p-8 text-center text-sm text-clinical-muted">
                Sélectionnez un item dans la liste pour l'éditer ou obtenir une suggestion IA
              </div>
            )}
          </div>
        </div>
      )}

      {/* Library Tab */}
      {activeTab === 'library' && (
      <Card padding="md">
        <CardHeader>
          <CardTitle>Bibliothèque d'items ({items.length})</CardTitle>
          <Button size="sm" onClick={() => setModalOpen(true)}>+ Nouvel item</Button>
        </CardHeader>

        {/* Filtres */}
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={filterTestId}
            onChange={e => setFilterTestId(e.target.value)}
            className="rounded-lg border border-clinical-border bg-white px-3 py-1.5 text-sm text-clinical-text focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Tous les tests</option>
            {WAIS_TESTS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as ItemStatus | '')}
            className="rounded-lg border border-clinical-border bg-white px-3 py-1.5 text-sm text-clinical-text focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="review">En révision</option>
            <option value="archived">Archivé</option>
          </select>
          <select
            value={filterRegion}
            onChange={e => setFilterRegion(e.target.value)}
            className="rounded-lg border border-clinical-border bg-white px-3 py-1.5 text-sm text-clinical-text focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Toutes les régions</option>
            <option value="France">France</option>
            <option value="Québec">Québec</option>
            <option value="Maghreb">Maghreb</option>
            <option value="Afrique subsaharienne">Afrique subsaharienne</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : items.length === 0 ? (
          <p className="text-sm text-clinical-muted text-center py-12">
            Aucun item trouvé. Modifiez les filtres ou ajoutez de nouveaux items.
          </p>
        ) : (
          <Table>
            <TableHead>
              <tr>
                <Th>Test</Th>
                <Th>Contenu</Th>
                <Th>Type</Th>
                <Th>Difficulté</Th>
                <Th>Score attendu</Th>
                <Th>Région</Th>
                <Th>Statut</Th>
                <Th>Actions</Th>
              </tr>
            </TableHead>
            <TableBody>
              {items.map(item => {
                const testMeta = WAIS_TESTS.find(t => t.id === item.test_id)
                const content = item.content_json as { prompt?: string }
                return (
                  <Tr key={item.id}>
                    <Td className="font-medium">{testMeta?.name ?? item.test_id}</Td>
                    <Td className="max-w-xs truncate">{content.prompt ?? '—'}</Td>
                    <Td>{item.item_type}</Td>
                    <Td>
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full ${i < item.difficulty_level ? 'bg-brand-500' : 'bg-gray-200'}`}
                          />
                        ))}
                      </div>
                    </Td>
                    <Td>{item.expected_score}</Td>
                    <Td>
                      <div className="flex flex-wrap gap-1">
                        {item.region.map(r => <Badge key={r} variant="gray">{r}</Badge>)}
                      </div>
                    </Td>
                    <Td>
                      <Badge variant={STATUS_VARIANTS[item.status]}>
                        {STATUS_LABELS[item.status]}
                      </Badge>
                    </Td>
                    <Td>
                      <select
                        value={item.status}
                        onChange={e => handleStatusChange(item.id, e.target.value as ItemStatus)}
                        className="text-xs border border-clinical-border rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      >
                        <option value="active">Actif</option>
                        <option value="review">En révision</option>
                        <option value="archived">Archivé</option>
                      </select>
                    </Td>
                  </Tr>
                )
              })}
            </TableBody>
          </Table>
        )}
      </Card>
      )} {/* end activeTab === 'library' */}

      {/* Modal création */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nouvel item" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-clinical-text">Test</label>
              <select
                {...register('test_id')}
                className="rounded-lg border border-clinical-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Sélectionnez un test</option>
                {WAIS_TESTS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              {errors.test_id && <p className="text-xs text-red-600">{errors.test_id.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-clinical-text">Type d'item</label>
              <select
                {...register('item_type')}
                className="rounded-lg border border-clinical-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="verbal">Verbal</option>
                <option value="nonverbal">Non-verbal</option>
                <option value="numerical">Numérique</option>
                <option value="spatial">Spatial</option>
              </select>
            </div>
          </div>

          <Textarea
            label="Contenu / Consigne"
            placeholder="Ex: En quoi une pomme et une orange sont-elles similaires ?"
            rows={3}
            {...register('prompt')}
            error={errors.prompt?.message}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="number" label="Score attendu" min={0} max={4}
              {...register('expected_score', { valueAsNumber: true })}
              error={errors.expected_score?.message}
            />
            <Input
              type="number" label="Niveau de difficulté (1-5)" min={1} max={5}
              {...register('difficulty_level', { valueAsNumber: true })}
              error={errors.difficulty_level?.message}
            />
          </div>

          <Input
            label="Tags (séparés par virgule)"
            placeholder="mémoire, attention, inhibition"
            {...register('tags')}
          />

          <Input
            label="Régions (séparées par virgule)"
            placeholder="France, Québec, Maghreb"
            {...register('region')}
          />

          <Textarea
            label="Notes culturelles"
            placeholder="Biais culturels connus, difficultés spécifiques à certaines populations..."
            rows={2}
            {...register('cultural_notes')}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Annuler</Button>
            <Button type="submit" loading={isSubmitting}>Créer l'item</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
