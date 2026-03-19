// src/services/collaboration.service.ts
import { supabase } from '@/lib/supabase'
import type { ClinicalComment, Proposal, ChangeLogEntry, CommentTargetType } from '@/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export const collaborationService = {
  // ---- COMMENTAIRES ----

  async getComments(targetType: CommentTargetType, targetId: string): Promise<ClinicalComment[]> {
    const { data, error } = await db
      .from('clinical_comments')
      .select(`
        *,
        author:profiles!clinical_comments_author_id_fkey(id, full_name, email, role, specialty)
      `)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .is('parent_id', null)
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []) as ClinicalComment[]
  },

  async getReplies(parentId: string): Promise<ClinicalComment[]> {
    const { data, error } = await db
      .from('clinical_comments')
      .select(`
        *,
        author:profiles!clinical_comments_author_id_fkey(id, full_name, email, role, specialty)
      `)
      .eq('parent_id', parentId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data ?? []) as ClinicalComment[]
  },

  async postComment(
    targetType: CommentTargetType,
    targetId: string,
    content: string,
    authorId: string,
    parentId?: string
  ): Promise<ClinicalComment> {
    const { data, error } = await db
      .from('clinical_comments')
      .insert({
        target_type: targetType,
        target_id: targetId,
        content,
        author_id: authorId,
        parent_id: parentId ?? null,
      })
      .select(`
        *,
        author:profiles!clinical_comments_author_id_fkey(id, full_name, email, role, specialty)
      `)
      .single()
    if (error) throw error
    return data as ClinicalComment
  },

  async deleteComment(id: string): Promise<void> {
    const { error } = await db.from('clinical_comments').delete().eq('id', id)
    if (error) throw error
  },

  // ---- PROPOSITIONS ----

  async getProposals(): Promise<Proposal[]> {
    const { data, error } = await db
      .from('proposals')
      .select(`
        *,
        proposer:profiles!proposals_proposed_by_fkey(id, full_name, email, specialty)
      `)
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as Proposal[]
  },

  async createProposal(
    title: string,
    description: string,
    configChanges: Record<string, unknown>,
    proposedBy: string
  ): Promise<Proposal> {
    const { data, error } = await db
      .from('proposals')
      .insert({
        title,
        description,
        config_changes: configChanges,
        proposed_by: proposedBy,
        status: 'pending',
      })
      .select()
      .single()
    if (error) throw error
    return data as Proposal
  },

  async vote(
    proposalId: string,
    clinicianId: string,
    vote: 'for' | 'against',
    comment?: string
  ): Promise<void> {
    const { error: voteError } = await db
      .from('proposal_votes')
      .insert({ proposal_id: proposalId, clinician_id: clinicianId, vote, comment: comment ?? null })
    if (voteError) throw voteError

    const field = vote === 'for' ? 'votes_for' : 'votes_against'
    const { data: current } = await db
      .from('proposals')
      .select(field)
      .eq('id', proposalId)
      .single()
    if (!current) return

    await db
      .from('proposals')
      .update({ [field]: (current[field] as number) + 1 })
      .eq('id', proposalId)
  },

  async deployProposal(proposalId: string, adminId: string): Promise<void> {
    await db
      .from('proposals')
      .update({ status: 'deployed' })
      .eq('id', proposalId)

    await db.from('change_log').insert({
      table_name: 'proposals',
      record_id: proposalId,
      change_type: 'deploy',
      changed_by: adminId,
    })
  },

  // ---- JOURNAL ----

  async getChangeLog(limit = 50): Promise<ChangeLogEntry[]> {
    const { data, error } = await db
      .from('change_log')
      .select(`
        *,
        author:profiles!change_log_changed_by_fkey(full_name, email)
      `)
      .order('changed_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return (data ?? []) as ChangeLogEntry[]
  },
}
