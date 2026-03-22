// src/services/remote-config.service.ts
// CRUD sur la table remote_config (paramètres lus par la Flutter app)

import { supabase } from '@/lib/supabase'
import { auditService } from './audit.service'

export interface RemoteConfigEntry {
  key: string
  value: unknown
  description?: string
  updated_by?: string
  updated_at?: string
}

export const remoteConfigService = {
  // Lire toutes les entrées
  async list(): Promise<RemoteConfigEntry[]> {
    const { data, error } = await supabase
      .from('remote_config')
      .select('*')
      .order('key')

    if (error) throw error
    return data ?? []
  },

  // Lire une valeur spécifique
  async get(key: string): Promise<unknown> {
    const { data, error } = await supabase
      .from('remote_config')
      .select('value')
      .eq('key', key)
      .single()

    if (error) throw error
    return data?.value
  },

  // Mettre à jour une valeur (avec audit)
  async set(key: string, value: unknown, description?: string): Promise<void> {
    const old = await remoteConfigService.get(key).catch(() => undefined)

    const { error } = await supabase
      .from('remote_config')
      .upsert({
        key,
        value,
        description,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' })

    if (error) throw error

    await auditService.log({
      tableName: 'remote_config',
      recordId: null,
      changeType: old !== undefined ? 'update' : 'create',
      oldValue: { key, value: old },
      newValue: { key, value },
    })
  },

  // Mettre à jour en masse
  async bulkSet(entries: Array<{ key: string; value: unknown; description?: string }>): Promise<void> {
    const rows = entries.map(e => ({
      ...e,
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabase
      .from('remote_config')
      .upsert(rows, { onConflict: 'key' })

    if (error) throw error
  },
}
