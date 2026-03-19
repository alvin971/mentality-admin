// src/services/items.service.ts
import { supabase } from '@/lib/supabase'
import type { ItemLibrary, ItemStatus, ItemContent, ItemType } from '@/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

interface ItemFilters {
  testId?: string
  status?: ItemStatus
  region?: string
  tag?: string
}

export const itemsService = {
  async list(filters: ItemFilters = {}): Promise<ItemLibrary[]> {
    let query = db
      .from('items_library')
      .select('*')
      .order('created_at', { ascending: false })

    if (filters.testId) query = query.eq('test_id', filters.testId)
    if (filters.status) query = query.eq('status', filters.status)
    if (filters.region) query = query.contains('region', [filters.region])
    if (filters.tag) query = query.contains('tags', [filters.tag])

    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as ItemLibrary[]
  },

  async create(item: {
    test_id: string
    item_type: ItemType
    content_json: ItemContent
    expected_score: number
    difficulty_level: number
    tags: string[]
    region: string[]
    created_by: string
  }): Promise<ItemLibrary> {
    const { data, error } = await db
      .from('items_library')
      .insert({ ...item, status: 'review' })
      .select()
      .single()
    if (error) throw error
    return data as ItemLibrary
  },

  async update(id: string, updates: Partial<Omit<ItemLibrary, 'id' | 'created_at' | 'created_by'>>): Promise<ItemLibrary> {
    const { data, error } = await db
      .from('items_library')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data as ItemLibrary
  },

  async setStatus(id: string, status: ItemStatus): Promise<void> {
    const { error } = await db
      .from('items_library')
      .update({ status })
      .eq('id', id)
    if (error) throw error
  },
}
