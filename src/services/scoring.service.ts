// src/services/scoring.service.ts
import { supabase } from '@/lib/supabase'
import type { TestConfiguration, TestConfigJson } from '@/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

export const scoringService = {
  async getAll(): Promise<TestConfiguration[]> {
    const { data, error } = await db
      .from('test_configurations')
      .select('*')
      .eq('is_active', true)
      .order('test_id')
    if (error) throw error
    return (data ?? []) as TestConfiguration[]
  },

  async getByTestId(testId: string): Promise<TestConfiguration | null> {
    const { data, error } = await db
      .from('test_configurations')
      .select('*')
      .eq('test_id', testId)
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return (data ?? null) as TestConfiguration | null
  },

  async getHistory(testId: string): Promise<TestConfiguration[]> {
    const { data, error } = await db
      .from('test_configurations')
      .select('*')
      .eq('test_id', testId)
      .order('version', { ascending: false })
    if (error) throw error
    return (data ?? []) as TestConfiguration[]
  },

  async save(testId: string, config: TestConfigJson, userId: string): Promise<TestConfiguration> {
    await db
      .from('test_configurations')
      .update({ is_active: false })
      .eq('test_id', testId)

    const { data: latest } = await db
      .from('test_configurations')
      .select('version')
      .eq('test_id', testId)
      .order('version', { ascending: false })
      .limit(1)
      .single()

    const nextVersion = ((latest as { version: number } | null)?.version ?? 0) + 1

    const { data, error } = await db
      .from('test_configurations')
      .insert({
        test_id: testId,
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
      table_name: 'test_configurations',
      record_id: (data as TestConfiguration).id,
      change_type: 'update',
      new_value: config,
      changed_by: userId,
    })

    return data as TestConfiguration
  },

  async rollback(configId: string, userId: string) {
    const { data: config, error } = await db
      .from('test_configurations')
      .select('*')
      .eq('id', configId)
      .single()
    if (error) throw error

    const c = config as TestConfiguration

    await db
      .from('test_configurations')
      .update({ is_active: false })
      .eq('test_id', c.test_id)

    await db
      .from('test_configurations')
      .update({ is_active: true })
      .eq('id', configId)

    await db.from('change_log').insert({
      table_name: 'test_configurations',
      record_id: configId,
      change_type: 'rollback',
      changed_by: userId,
    })
  },
}
