// src/services/audit.service.ts
// Wrapper autour de la table change_log pour enregistrer chaque mutation

import { supabase } from '@/lib/supabase'

export interface ChangeLogEntry {
  id: string
  table_name: string
  record_id: string | null
  change_type: 'create' | 'update' | 'delete' | 'rollback' | 'deploy'
  old_value: unknown
  new_value: unknown
  changed_by: string | null
  changed_at: string
  ai_suggested: boolean
  status: 'draft' | 'approved' | 'deployed' | 'reverted'
  // joined
  changer_name?: string
}

export interface ChangeLogFilter {
  tableName?: string
  status?: string
  changedBy?: string
  from?: string
  to?: string
  limit?: number
}

export const auditService = {
  // Enregistrer un changement
  async log(params: {
    tableName: string
    recordId?: string | null
    changeType: ChangeLogEntry['change_type']
    oldValue?: unknown
    newValue?: unknown
    aiSuggested?: boolean
    status?: ChangeLogEntry['status']
  }): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('change_log').insert({
      table_name: params.tableName,
      record_id: params.recordId ?? null,
      change_type: params.changeType,
      old_value: params.oldValue ?? null,
      new_value: params.newValue ?? null,
      changed_by: user?.id ?? null,
      ai_suggested: params.aiSuggested ?? false,
      status: params.status ?? 'deployed',
    })

    if (error) console.error('Audit log error:', error)
  },

  // Lire le journal (avec filtres optionnels)
  async list(filter: ChangeLogFilter = {}): Promise<ChangeLogEntry[]> {
    let query = supabase
      .from('change_log')
      .select(`
        *,
        profiles!changed_by(full_name)
      `)
      .order('changed_at', { ascending: false })
      .limit(filter.limit ?? 100)

    if (filter.tableName) query = query.eq('table_name', filter.tableName)
    if (filter.status) query = query.eq('status', filter.status)
    if (filter.changedBy) query = query.eq('changed_by', filter.changedBy)
    if (filter.from) query = query.gte('changed_at', filter.from)
    if (filter.to) query = query.lte('changed_at', filter.to)

    const { data, error } = await query
    if (error) throw error

    return (data ?? []).map((row: any) => ({
      ...row,
      changer_name: row.profiles?.full_name ?? 'Inconnu',
    }))
  },

  // Compter les changements par table
  async countByTable(): Promise<Array<{ table_name: string; count: number }>> {
    const { data, error } = await supabase
      .from('change_log')
      .select('table_name')

    if (error) throw error

    const counts: Record<string, number> = {}
    for (const row of data ?? []) {
      counts[row.table_name] = (counts[row.table_name] ?? 0) + 1
    }

    return Object.entries(counts)
      .map(([table_name, count]) => ({ table_name, count }))
      .sort((a, b) => b.count - a.count)
  },

  // Mettre à jour le statut d'une entrée
  async updateStatus(id: string, status: ChangeLogEntry['status']): Promise<void> {
    const { error } = await supabase
      .from('change_log')
      .update({ status })
      .eq('id', id)

    if (error) throw error
  },

  // Revert — restaurer l'ancienne valeur d'un enregistrement
  async revert(entry: ChangeLogEntry): Promise<void> {
    if (!entry.old_value || !entry.record_id) {
      throw new Error('Impossible de reverter: pas de valeur précédente')
    }

    // Restaurer l'ancienne valeur dans la table cible
    const { error } = await supabase
      .from(entry.table_name)
      .update(entry.old_value as object)
      .eq('id', entry.record_id)

    if (error) throw error

    // Logger le revert
    await auditService.log({
      tableName: entry.table_name,
      recordId: entry.record_id,
      changeType: 'rollback',
      oldValue: entry.new_value,
      newValue: entry.old_value,
      status: 'deployed',
    })

    // Marquer l'entrée originale comme revertée
    await auditService.updateStatus(entry.id, 'reverted')
  },
}
