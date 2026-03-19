// src/pages/TestFlowPage.tsx
import { useEffect, useState } from 'react'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { flowService } from '@/services/flow.service'
import { useAuth } from '@/hooks/useAuth'
import { WAIS_TESTS, INDEX_COLORS } from '@/types'
import type { TestFlowItem, FlowConfigJson } from '@/types'

function SortableTest({ item }: { item: TestFlowItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.test_id })
  const testMeta = WAIS_TESTS.find(t => t.id === item.test_id)

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 px-4 py-3 bg-white border border-clinical-border rounded-lg ${
        isDragging ? 'shadow-lg opacity-90 z-10' : ''
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="text-clinical-muted hover:text-clinical-text cursor-grab active:cursor-grabbing"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
          <path d="M4 6a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm8 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM4 13a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm8 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
        </svg>
      </button>
      <span className="text-sm font-medium text-clinical-text flex-1">{testMeta?.name ?? item.test_id}</span>
      <Badge variant={INDEX_COLORS[testMeta?.index ?? 'ICV'] as 'blue' | 'gray' | 'green' | 'orange' | 'red'}>
        {testMeta?.index}
      </Badge>
      {item.is_required ? (
        <Badge variant="blue">Obligatoire</Badge>
      ) : (
        <Badge variant="gray">Optionnel</Badge>
      )}
    </div>
  )
}

interface EditModalState {
  open: boolean
  item: TestFlowItem | null
}

export function TestFlowPage() {
  const { user } = useAuth()
  const [tests, setTests] = useState<TestFlowItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editModal, setEditModal] = useState<EditModalState>({ open: false, item: null })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    flowService.getActive().then(config => {
      if (config) {
        setTests(config.config_json.tests)
      } else {
        // Initialise avec l'ordre par défaut
        setTests(
          WAIS_TESTS.map((t, i) => ({
            test_id: t.id,
            order: i,
            is_required: true,
            display_condition: null,
            time_limit_seconds: null,
            intro_message: '',
          }))
        )
      }
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setTests(items => {
      const oldIndex = items.findIndex(i => i.test_id === active.id)
      const newIndex = items.findIndex(i => i.test_id === over.id)
      return arrayMove(items, oldIndex, newIndex).map((t, idx) => ({ ...t, order: idx }))
    })
  }

  async function handleSave() {
    if (!user) return
    setSaving(true)
    try {
      const config: FlowConfigJson = { tests, groups: [] }
      await flowService.save(config, user.id)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  function openEdit(testId: string) {
    const item = tests.find(t => t.test_id === testId)
    if (item) setEditModal({ open: true, item })
  }

  function saveItemEdit(updated: TestFlowItem) {
    setTests(ts => ts.map(t => t.test_id === updated.test_id ? updated : t))
    setEditModal({ open: false, item: null })
  }

  if (loading) {
    return <div className="flex justify-center pt-16"><Spinner size="lg" /></div>
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <Card padding="md">
        <CardHeader>
          <CardTitle>Ordre des tests (drag & drop)</CardTitle>
          <Button onClick={handleSave} loading={saving} size="sm">
            Sauvegarder l'ordre
          </Button>
        </CardHeader>
        <p className="text-sm text-clinical-muted mb-4">
          Faites glisser les tests pour les réordonner. Cliquez sur un test pour configurer ses options.
        </p>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={tests.map(t => t.test_id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {tests.map(item => (
                <div key={item.test_id} className="group relative">
                  <SortableTest item={item} />
                  <button
                    onClick={() => openEdit(item.test_id)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-brand-600 hover:text-brand-800 font-medium px-2"
                  >
                    Configurer
                  </button>
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </Card>

      {/* Modal configuration individuelle */}
      {editModal.item && (
        <TestItemEditModal
          item={editModal.item}
          open={editModal.open}
          onClose={() => setEditModal({ open: false, item: null })}
          onSave={saveItemEdit}
        />
      )}
    </div>
  )
}

function TestItemEditModal({
  item, open, onClose, onSave,
}: {
  item: TestFlowItem
  open: boolean
  onClose: () => void
  onSave: (item: TestFlowItem) => void
}) {
  const testMeta = WAIS_TESTS.find(t => t.id === item.test_id)
  const [form, setForm] = useState<TestFlowItem>(item)

  return (
    <Modal open={open} onClose={onClose} title={`Configurer — ${testMeta?.name ?? item.test_id}`} size="md">
      <div className="space-y-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="rounded border-clinical-border text-brand-600 focus:ring-brand-500"
            checked={form.is_required}
            onChange={e => setForm(f => ({ ...f, is_required: e.target.checked }))}
          />
          <span className="text-sm font-medium text-clinical-text">Test obligatoire</span>
        </label>

        <Input
          label="Condition d'affichage (optionnel)"
          placeholder="Ex: score_IMT < 85"
          value={form.display_condition ?? ''}
          onChange={e => setForm(f => ({ ...f, display_condition: e.target.value || null }))}
        />

        <Input
          type="number"
          label="Temps limite par item (secondes, 0 = illimité)"
          min={0}
          value={form.time_limit_seconds ?? 0}
          onChange={e => setForm(f => ({ ...f, time_limit_seconds: Number(e.target.value) || null }))}
        />

        <Textarea
          label="Message d'introduction"
          placeholder="Texte affiché avant ce test..."
          rows={3}
          value={form.intro_message}
          onChange={e => setForm(f => ({ ...f, intro_message: e.target.value }))}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button onClick={() => onSave(form)}>Enregistrer</Button>
        </div>
      </div>
    </Modal>
  )
}
