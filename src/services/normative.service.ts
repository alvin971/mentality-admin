// src/services/normative.service.ts
// CRUD sur la table normative_tables

import { supabase } from '@/lib/supabase'

export interface NormativeEntry {
  id?: string
  test_id: string
  age_group: string
  raw_score: number
  scaled_score: number
  percentile: number
  updated_by?: string
  updated_at?: string
}

// Groupes d'âge WAIS-IV officiels
export const AGE_GROUPS = [
  '16-17', '18-19', '20-24', '25-29', '30-34',
  '35-44', '45-54', '55-64', '65-69', '70-74',
  '75-79', '80-84', '85-90',
]

// Tous les tests WAIS-IV
export const WAIS_TEST_IDS = [
  'similitudes', 'vocabulaire', 'information', 'cubes',
  'matrices', 'balances', 'puzzles_visuels', 'empan_chiffres',
  'arithmetique', 'memoire_images', 'code', 'recherche_symboles',
]

export const normativeService = {
  // Lire toutes les entrées pour un test + groupe d'âge
  async list(testId: string, ageGroup: string): Promise<NormativeEntry[]> {
    const { data, error } = await supabase
      .from('normative_tables')
      .select('*')
      .eq('test_id', testId)
      .eq('age_group', ageGroup)
      .order('raw_score', { ascending: true })

    if (error) throw error
    return data ?? []
  },

  // Lire toutes les entrées pour un test (tous groupes d'âge)
  async listByTest(testId: string): Promise<NormativeEntry[]> {
    const { data, error } = await supabase
      .from('normative_tables')
      .select('*')
      .eq('test_id', testId)
      .order('age_group')
      .order('raw_score', { ascending: true })

    if (error) throw error
    return data ?? []
  },

  // Upsert une entrée
  async upsert(entry: NormativeEntry): Promise<NormativeEntry> {
    const { data, error } = await supabase
      .from('normative_tables')
      .upsert(
        { ...entry, updated_at: new Date().toISOString() },
        { onConflict: 'test_id,age_group,raw_score' }
      )
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Upsert en masse (import CSV)
  async bulkUpsert(entries: NormativeEntry[]): Promise<void> {
    const rows = entries.map(e => ({ ...e, updated_at: new Date().toISOString() }))
    const { error } = await supabase
      .from('normative_tables')
      .upsert(rows, { onConflict: 'test_id,age_group,raw_score' })

    if (error) throw error
  },

  // Supprimer une entrée
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('normative_tables')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Supprimer toutes les entrées d'un test + groupe d'âge
  async deleteGroup(testId: string, ageGroup: string): Promise<void> {
    const { error } = await supabase
      .from('normative_tables')
      .delete()
      .eq('test_id', testId)
      .eq('age_group', ageGroup)

    if (error) throw error
  },

  // Parser un texte CSV en entrées
  // Format attendu : raw_score,scaled_score,percentile (une ligne de header)
  parseCsv(csvText: string, testId: string, ageGroup: string): NormativeEntry[] {
    const lines = csvText.trim().split('\n')
    const start = lines[0].toLowerCase().includes('raw') ? 1 : 0
    return lines.slice(start).map(line => {
      const cols = line.split(',').map(c => c.trim())
      return {
        test_id: testId,
        age_group: ageGroup,
        raw_score: parseInt(cols[0]),
        scaled_score: parseInt(cols[1]),
        percentile: parseInt(cols[2]),
      }
    }).filter(e => !isNaN(e.raw_score) && !isNaN(e.scaled_score) && !isNaN(e.percentile))
  },

  // Exporter en CSV
  toCsv(entries: NormativeEntry[]): string {
    const header = 'raw_score,scaled_score,percentile'
    const rows = entries.map(e => `${e.raw_score},${e.scaled_score},${e.percentile}`)
    return [header, ...rows].join('\n')
  },

  // Valider la cohérence des données (monotonie, plage)
  validate(entries: NormativeEntry[]): string[] {
    const errors: string[] = []
    const sorted = [...entries].sort((a, b) => a.raw_score - b.raw_score)

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1]
      const curr = sorted[i]

      if (curr.scaled_score < prev.scaled_score) {
        errors.push(`Non-monotonie : raw ${curr.raw_score} → normalisé ${curr.scaled_score} < précédent ${prev.scaled_score}`)
      }
      if (curr.percentile < prev.percentile) {
        errors.push(`Non-monotonie : raw ${curr.raw_score} → percentile ${curr.percentile} < précédent ${prev.percentile}`)
      }
      if (curr.scaled_score < 1 || curr.scaled_score > 19) {
        errors.push(`Score normalisé hors plage [1-19] : ${curr.scaled_score} pour raw ${curr.raw_score}`)
      }
      if (curr.percentile < 1 || curr.percentile > 99) {
        errors.push(`Percentile hors plage [1-99] : ${curr.percentile} pour raw ${curr.raw_score}`)
      }
    }

    return errors
  },
}
