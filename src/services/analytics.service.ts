// src/services/analytics.service.ts
import { supabase } from '@/lib/supabase'
import type { ChangeLogEntry } from '@/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export const analyticsService = {
  async getActiveClinicianCount(): Promise<number> {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'clinician')
      .eq('is_active', true)
    if (error) throw error
    return count ?? 0
  },

  async getActiveConfigCount(): Promise<number> {
    // Use db for test_configurations since it's not in the base schema
    const { count: configCount, error: configError } = await db
      .from('test_configurations')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
    if (configError) return 0
    return configCount ?? 0
  },

  async getPendingProposalCount(): Promise<number> {
    const { count, error } = await db
      .from('proposals')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
    if (error) throw error
    return count ?? 0
  },

  async getRecentActivity(limit = 10): Promise<ChangeLogEntry[]> {
    const { data, error } = await db
      .from('change_log')
      .select(`
        *,
        author:profiles!change_log_changed_by_fkey(full_name, email, role)
      `)
      .order('changed_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return (data ?? []) as ChangeLogEntry[]
  },

  async getItemStats(): Promise<{ active: number; review: number; archived: number }> {
    const { data, error } = await db
      .from('items_library')
      .select('status')
    if (error) throw error

    return (data ?? []).reduce(
      (acc: { active: number; review: number; archived: number }, row: { status: string }) => {
        const s = row.status as 'active' | 'review' | 'archived'
        acc[s] = (acc[s] ?? 0) + 1
        return acc
      },
      { active: 0, review: 0, archived: 0 }
    )
  },
}
