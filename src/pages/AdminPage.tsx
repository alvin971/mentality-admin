// src/pages/AdminPage.tsx
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Table, TableHead, TableBody, Th, Td, Tr } from '@/components/ui/Table'
import { Spinner } from '@/components/ui/Spinner'
import { authService } from '@/services/auth.service'
import { analyticsService } from '@/services/analytics.service'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { Profile, ChangeLogEntry } from '@/types'

const inviteSchema = z.object({
  email:       z.string().email('Email invalide'),
  full_name:   z.string().min(2, 'Nom requis'),
  specialty:   z.enum(['psychiatre', 'psychologue', 'neuropsychologue', 'chercheur']),
  institution: z.string().min(2, 'Institution requise'),
})
type InviteForm = z.infer<typeof inviteSchema>

export function AdminPage() {
  const [clinicians, setClinicians] = useState<Profile[]>([])
  const [activity, setActivity] = useState<ChangeLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteModal, setInviteModal] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)

  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { specialty: 'psychologue' },
  })

  async function loadData() {
    setLoading(true)
    try {
      const [profiles, recent] = await Promise.all([
        authService.listClinicians(),
        analyticsService.getRecentActivity(20),
      ])
      setClinicians((profiles.data ?? []) as Profile[])
      setActivity(recent)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  async function handleInvite(data: InviteForm) {
    const { error } = await authService.inviteClinician(
      data.email, data.full_name, data.specialty, data.institution
    )
    if (error) {
      setError('root', { message: error.message })
      return
    }
    setInviteSuccess(data.email)
    reset()
  }

  async function toggleActive(clinician: Profile) {
    await authService.setClinicianActive(clinician.id, !clinician.is_active)
    loadData()
  }

  const SPECIALTY_LABELS: Record<string, string> = {
    psychiatre:       'Psychiatre',
    psychologue:      'Psychologue',
    neuropsychologue: 'Neuropsychologue',
    chercheur:        'Chercheur',
  }

  if (loading) return <div className="flex justify-center pt-16"><Spinner size="lg" /></div>

  return (
    <div className="space-y-5 max-w-5xl">
      {/* Cliniciens */}
      <Card padding="md">
        <CardHeader>
          <CardTitle>Cliniciens ({clinicians.length})</CardTitle>
          <Button size="sm" onClick={() => { setInviteSuccess(null); setInviteModal(true) }}>
            + Inviter un clinicien
          </Button>
        </CardHeader>

        {clinicians.length === 0 ? (
          <p className="text-sm text-clinical-muted text-center py-10">
            Aucun clinicien enregistré. Invitez des praticiens pour démarrer la collaboration.
          </p>
        ) : (
          <Table>
            <TableHead>
              <tr>
                <Th>Nom</Th>
                <Th>Email</Th>
                <Th>Spécialité</Th>
                <Th>Institution</Th>
                <Th>Inscrit le</Th>
                <Th>Statut</Th>
                <Th>Action</Th>
              </tr>
            </TableHead>
            <TableBody>
              {clinicians.map(c => (
                <Tr key={c.id}>
                  <Td className="font-medium">{c.full_name}</Td>
                  <Td className="text-clinical-muted">{c.email}</Td>
                  <Td>{c.specialty ? SPECIALTY_LABELS[c.specialty] : '—'}</Td>
                  <Td>{c.institution ?? '—'}</Td>
                  <Td className="text-clinical-muted text-xs">
                    {format(new Date(c.created_at), 'dd MMM yyyy', { locale: fr })}
                  </Td>
                  <Td>
                    <Badge variant={c.is_active ? 'green' : 'gray'}>
                      {c.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </Td>
                  <Td>
                    <Button
                      variant={c.is_active ? 'ghost' : 'secondary'}
                      size="sm"
                      onClick={() => toggleActive(c)}
                    >
                      {c.is_active ? 'Désactiver' : 'Réactiver'}
                    </Button>
                  </Td>
                </Tr>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Journal d'activité */}
      <Card padding="md">
        <CardHeader>
          <CardTitle>Journal d'activité global</CardTitle>
        </CardHeader>
        {activity.length === 0 ? (
          <p className="text-sm text-clinical-muted text-center py-6">Aucune activité enregistrée.</p>
        ) : (
          <div className="space-y-1">
            {activity.map(entry => (
              <div key={entry.id} className="flex items-start gap-3 py-2 border-b border-clinical-border last:border-0">
                <Badge variant={entry.change_type === 'deploy' ? 'green' : 'blue'}>
                  {entry.change_type}
                </Badge>
                <div className="flex-1">
                  <p className="text-sm text-clinical-text">{entry.table_name.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-clinical-muted">
                    {entry.author
                      ? (entry.author as { full_name: string }).full_name
                      : 'Système'
                    }
                    {' · '}
                    {format(new Date(entry.changed_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Modal invitation */}
      <Modal open={inviteModal} onClose={() => setInviteModal(false)} title="Inviter un clinicien" size="md">
        {inviteSuccess ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-sm font-medium text-clinical-text">Invitation envoyée</p>
            <p className="text-sm text-clinical-muted">
              Un email d'activation a été envoyé à <strong>{inviteSuccess}</strong>.
              Le lien est valable 48 heures.
            </p>
            <Button onClick={() => setInviteModal(false)}>Fermer</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(handleInvite)} className="space-y-4">
            <Input
              label="Nom complet"
              placeholder="Dr. Marie Dupont"
              {...register('full_name')}
              error={errors.full_name?.message}
            />
            <Input
              type="email"
              label="Adresse email"
              placeholder="marie.dupont@chu-paris.fr"
              {...register('email')}
              error={errors.email?.message}
            />
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-clinical-text">Spécialité</label>
              <select
                {...register('specialty')}
                className="rounded-lg border border-clinical-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="psychiatre">Psychiatre</option>
                <option value="psychologue">Psychologue</option>
                <option value="neuropsychologue">Neuropsychologue</option>
                <option value="chercheur">Chercheur</option>
              </select>
            </div>
            <Input
              label="Institution / Établissement"
              placeholder="CHU Paris, Cabinet libéral..."
              {...register('institution')}
              error={errors.institution?.message}
            />

            {errors.root && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2">
                <p className="text-sm text-red-700">{errors.root.message}</p>
              </div>
            )}

            <p className="text-xs text-clinical-muted">
              Un email avec un lien d'activation (valable 48h) sera envoyé automatiquement.
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setInviteModal(false)}>Annuler</Button>
              <Button type="submit" loading={isSubmitting}>Envoyer l'invitation</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
