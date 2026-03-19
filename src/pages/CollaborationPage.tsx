// src/pages/CollaborationPage.tsx
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Textarea, Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import { collaborationService } from '@/services/collaboration.service'
import { useAuth } from '@/hooks/useAuth'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { ClinicalComment, Proposal, ChangeLogEntry } from '@/types'

const TABS = ['commentaires', 'propositions', 'journal'] as const
type Tab = typeof TABS[number]

const PROPOSAL_STATUS_VARIANTS: Record<string, 'gray' | 'orange' | 'green' | 'red' | 'blue'> = {
  pending:  'orange',
  approved: 'green',
  rejected: 'red',
  deployed: 'blue',
}
const PROPOSAL_STATUS_LABELS: Record<string, string> = {
  pending:  'En attente',
  approved: 'Approuvé',
  rejected: 'Rejeté',
  deployed: 'Déployé',
}

export function CollaborationPage() {
  const { user, isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('commentaires')
  const [comments, setComments] = useState<ClinicalComment[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [changeLog, setChangeLog] = useState<ChangeLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [proposalModal, setProposalModal] = useState(false)

  const commentForm = useForm<{ content: string; target_id: string }>({
    defaultValues: { content: '', target_id: 'general' },
  })

  const proposalForm = useForm<{ title: string; description: string }>({
    defaultValues: { title: '', description: '' },
  })

  async function loadData() {
    setLoading(true)
    try {
      const [c, p, log] = await Promise.all([
        collaborationService.getComments('test', 'general'),
        collaborationService.getProposals(),
        collaborationService.getChangeLog(30),
      ])
      setComments(c)
      setProposals(p)
      setChangeLog(log)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  async function postComment(data: { content: string; target_id: string }) {
    if (!user) return
    await collaborationService.postComment('test', data.target_id || 'general', data.content, user.id)
    commentForm.reset()
    loadData()
  }

  async function createProposal(data: { title: string; description: string }) {
    if (!user) return
    await collaborationService.createProposal(data.title, data.description, {}, user.id)
    proposalForm.reset()
    setProposalModal(false)
    loadData()
  }

  async function handleVote(proposalId: string, vote: 'for' | 'against') {
    if (!user) return
    await collaborationService.vote(proposalId, user.id, vote)
    loadData()
  }

  async function handleDeploy(proposalId: string) {
    if (!user) return
    await collaborationService.deployProposal(proposalId, user.id)
    loadData()
  }

  const TAB_LABELS: Record<Tab, string> = {
    commentaires:  `Commentaires (${comments.length})`,
    propositions:  `Propositions (${proposals.length})`,
    journal:       `Journal (${changeLog.length})`,
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <Card padding="none">
        <div className="flex border-b border-clinical-border px-6 pt-4 gap-1">
          {TABS.map(tab => (
            <button
              key={tab}
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

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : (
            <>
              {/* ---- COMMENTAIRES ---- */}
              {activeTab === 'commentaires' && (
                <div className="space-y-5">
                  <form onSubmit={commentForm.handleSubmit(postComment)} className="space-y-3">
                    <Input
                      label="Cible (ID du test ou 'general')"
                      placeholder="general"
                      {...commentForm.register('target_id')}
                    />
                    <Textarea
                      label="Votre commentaire (Markdown supporté)"
                      placeholder="Observations cliniques, nuances d'interprétation... Mentionnez un collègue avec @nom"
                      rows={4}
                      {...commentForm.register('content', { required: true })}
                    />
                    <div className="flex justify-end">
                      <Button type="submit" size="sm">Publier</Button>
                    </div>
                  </form>

                  {comments.length === 0 ? (
                    <p className="text-sm text-clinical-muted text-center py-8">
                      Aucun commentaire pour le moment. Soyez le premier à contribuer.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {comments.map(comment => (
                        <div key={comment.id} className="flex gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-xs font-bold flex-shrink-0">
                            {comment.author?.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-clinical-text">
                                {comment.author?.full_name ?? 'Clinicien'}
                              </span>
                              {comment.author?.specialty && (
                                <Badge variant="gray">{comment.author.specialty}</Badge>
                              )}
                              <span className="text-xs text-clinical-muted">
                                {format(new Date(comment.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                              </span>
                            </div>
                            <p className="text-sm text-clinical-text bg-gray-50 rounded-lg px-3 py-2">
                              {comment.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ---- PROPOSITIONS ---- */}
              {activeTab === 'propositions' && (
                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button size="sm" onClick={() => setProposalModal(true)}>
                      + Nouvelle proposition
                    </Button>
                  </div>

                  {proposals.length === 0 ? (
                    <p className="text-sm text-clinical-muted text-center py-8">
                      Aucune proposition en cours.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {proposals.map(proposal => (
                        <div key={proposal.id} className="border border-clinical-border rounded-xl p-4 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-clinical-text">{proposal.title}</p>
                              <p className="text-xs text-clinical-muted mt-0.5">
                                par {proposal.proposer
                                  ? (proposal.proposer as { full_name: string }).full_name
                                  : 'Clinicien'
                                }
                                {' · '}
                                {format(new Date(proposal.created_at), 'dd MMM yyyy', { locale: fr })}
                              </p>
                            </div>
                            <Badge variant={PROPOSAL_STATUS_VARIANTS[proposal.status]}>
                              {PROPOSAL_STATUS_LABELS[proposal.status]}
                            </Badge>
                          </div>
                          <p className="text-sm text-clinical-subtle">{proposal.description}</p>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-sm text-clinical-muted">
                              <span className="text-emerald-600 font-medium">{proposal.votes_for} pour</span>
                              <span>·</span>
                              <span className="text-red-500 font-medium">{proposal.votes_against} contre</span>
                            </div>
                            {proposal.status === 'pending' && (
                              <div className="flex gap-2 ml-auto">
                                <Button
                                  variant="secondary" size="sm"
                                  onClick={() => handleVote(proposal.id, 'for')}
                                >
                                  Approuver
                                </Button>
                                <Button
                                  variant="ghost" size="sm"
                                  onClick={() => handleVote(proposal.id, 'against')}
                                >
                                  Rejeter
                                </Button>
                                {isAdmin && proposal.votes_for >= 3 && (
                                  <Button size="sm" onClick={() => handleDeploy(proposal.id)}>
                                    Déployer
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                          {proposal.votes_for >= 3 && proposal.status === 'pending' && (
                            <p className="text-xs text-emerald-600 bg-emerald-50 rounded-lg px-3 py-1.5">
                              3 approbations atteintes — prête à déployer{!isAdmin && ' (admin requis)'}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ---- JOURNAL ---- */}
              {activeTab === 'journal' && (
                <div className="space-y-2">
                  {changeLog.length === 0 ? (
                    <p className="text-sm text-clinical-muted text-center py-8">
                      Aucune modification enregistrée.
                    </p>
                  ) : (
                    changeLog.map(entry => (
                      <div key={entry.id} className="flex items-start gap-3 py-2.5 border-b border-clinical-border last:border-0">
                        <Badge variant={entry.change_type === 'deploy' ? 'green' : entry.change_type === 'rollback' ? 'orange' : 'blue'}>
                          {entry.change_type}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-clinical-text">
                            {entry.table_name.replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs text-clinical-muted">
                            {entry.author
                              ? (entry.author as { full_name: string }).full_name
                              : 'Système'
                            }
                            {' · '}
                            {format(new Date(entry.changed_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                          </p>
                        </div>
                        {isAdmin && entry.change_type === 'update' && (
                          <button className="text-xs text-brand-600 hover:text-brand-800 font-medium flex-shrink-0">
                            Rollback
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      {/* Modal nouvelle proposition */}
      <Modal open={proposalModal} onClose={() => setProposalModal(false)} title="Nouvelle proposition" size="md">
        <form onSubmit={proposalForm.handleSubmit(createProposal)} className="space-y-4">
          <Input
            label="Titre de la proposition"
            placeholder="Ex: Modifier les seuils du test Vocabulaire"
            {...proposalForm.register('title', { required: true })}
          />
          <Textarea
            label="Description détaillée"
            placeholder="Décrivez la modification proposée, la justification clinique, et l'impact attendu..."
            rows={5}
            {...proposalForm.register('description', { required: true })}
          />
          <p className="text-xs text-clinical-muted">
            La proposition sera soumise au vote de tous les cliniciens. 3 approbations sont nécessaires avant déploiement par l'admin.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setProposalModal(false)}>Annuler</Button>
            <Button type="submit">Soumettre</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
