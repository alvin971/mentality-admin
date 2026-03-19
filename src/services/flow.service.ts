// src/services/flow.service.ts
import { supabase } from '@/lib/supabase'
import type { FlowConfiguration, FlowConfigJson } from '@/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export const flowService = {
  async getActive(): Promise<FlowConfiguration | null> {
    const { data, error } = await db
      .from('flow_configurations')
      .select('*')
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return (data ?? null) as FlowConfiguration | null
  },

  async getHistory(): Promise<FlowConfiguration[]> {
    const { data, error } = await db
      .from('flow_configurations')
      .select('*')
      .order('version', { ascending: false })
    if (error) throw error
    return (data ?? []) as FlowConfiguration[]
  },

  async save(config: FlowConfigJson, userId: string): Promise<FlowConfiguration> {
    const { data: latest } = await db
      .from('flow_configurations')
      .select('version')
      .order('version', { ascending: false })
      .limit(1)
      .single()

    const nextVersion = ((latest as { version: number } | null)?.version ?? 0) + 1

    await db
      .from('flow_configurations')
      .update({ is_active: false })
      .eq('is_active', true)

    const { data, error } = await db
      .from('flow_configurations')
      .insert({
        config_json: config,
        updated_by: userId,
        updated_at: new Date().toISOString(),
        version: nextVersion,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    await db.from('change_log').insert({
      table_name: 'flow_configurations',
      record_id: (data as FlowConfiguration).id,
      change_type: 'update',
      new_value: config,
      changed_by: userId,
    })

    return data as FlowConfiguration
  },
}
