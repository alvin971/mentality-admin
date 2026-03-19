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
  const [items, setItems] = useState<ItemLibrary[]>([])
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

  useEffect(() => { loadItems() }, [filterTestId, filterStatus, filterRegion]) // eslint-disable-line react-hooks/exhaustive-deps

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

      {/* Modal création */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nouvel item" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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

          <div className="grid grid-cols-2 gap-4">
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
