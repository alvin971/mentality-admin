// src/types/scoring.ts
// Typed config structures for each of the 12 WAIS-IV tests

// ============================================================
// COMMON
// ============================================================

export type ScoringType = 'partial' | 'dichotomic' | 'time_bonus' | 'span' | 'speed'

export interface BaseConfig {
  type: ScoringType
  name: string
  index: 'ICV' | 'IRP' | 'IMT' | 'IVT'
  notes: string
  thresholds: {
    very_low:  [number, number]
    low:       [number, number]
    average:   [number, number]
    high:      [number, number]
    very_high: [number, number]
  }
  weight: number
}

// ============================================================
// PARTIAL SCORING — Similitudes, Vocabulaire (0/1/2 pts)
// ============================================================

export interface PartialScoringItem {
  id: string
  label: string          // e.g. "Pomme / Orange"
  level: number          // 1–4 difficulty level
  theta: number          // IRT difficulty parameter
  score_2_criteria: string
  score_1_criteria: string
  keywords_2: string[]   // keywords that yield 2 pts
  keywords_1: string[]   // keywords that yield 1 pt
}

export interface PartialScoringConfig extends BaseConfig {
  type: 'partial'
  items: PartialScoringItem[]
  discontinuation_rule: {
    consecutive_zeros: number  // 0 = disabled
  }
}

// ============================================================
// DICHOTOMIC — Information, Matrices, Balances, Puzzles Visuels, Mémoire Images (0/1)
// ============================================================

export interface DichotomicItem {
  id: string
  label: string
  level: number
  theta: number
  correct_answer?: string  // for MCQ items (Information)
  domain?: string          // e.g. "Sciences", "Histoire" for Information
}

export interface DichotomicConfig extends BaseConfig {
  type: 'dichotomic'
  items: DichotomicItem[]
  discontinuation_rule: {
    consecutive_fails: number  // 0 = disabled
  } | null
}

// ============================================================
// TIME BONUS — Cubes, Arithmétique (0/1 + bonus pts for speed)
// ============================================================

export interface TimeBonusThreshold {
  max_seconds: number  // if completed within this time…
  bonus: number        // …award this bonus score
}

export interface TimeBonusItem {
  id: string
  label: string
  level: number
  base_score: number          // score if correct (no time bonus)
  time_limit_s: number        // max allowed time
  bonus_thresholds: TimeBonusThreshold[]  // sorted descending by max_seconds
}

export interface TimeBonusConfig extends BaseConfig {
  type: 'time_bonus'
  items: TimeBonusItem[]
  discontinuation_rule: {
    consecutive_fails: number
  }
}

// ============================================================
// SPAN — Empan Chiffres (Forward / Backward / Sequencing)
// ============================================================

export interface SpanLevel {
  length: number        // digit sequence length
  sequences: string[][]  // each trial's digits, e.g. [["1","7","3"], ["9","2","6"]]
  theta: number
}

export interface DigitSpanConfig extends BaseConfig {
  type: 'span'
  parts: {
    forward:    SpanLevel[]
    backward:   SpanLevel[]
    sequencing: SpanLevel[]
  }
  discontinuation_rule: {
    fails_per_length: number  // 2 = standard WAIS-IV rule
  }
}

// ============================================================
// SPEED — Code, Recherche Symboles (timed, count items done)
// ============================================================

export interface SpeedConfig extends BaseConfig {
  type: 'speed'
  time_limit_s: number    // 120 for both tests
  total_items: number     // 135 for Code, 60 for Recherche Symboles
  training_items: number  // practice items before the timed section
}

// ============================================================
// UNION TYPE — what gets stored in config_json
// ============================================================

export type WaisTestConfig =
  | PartialScoringConfig
  | DichotomicConfig
  | TimeBonusConfig
  | DigitSpanConfig
  | SpeedConfig

// ============================================================
// NORMATIVE TABLE (for scaled score lookup)
// ============================================================

export interface NormativeEntry {
  id: string
  test_id: string
  age_group: string     // e.g. "16-17", "18-19", "20-24", "25-29" ...
  raw_score: number
  scaled_score: number  // standard score 1–19
  percentile: number
  updated_by: string | null
  updated_at: string
}

// ============================================================
// TEST TYPE MAP — which config type each test uses
// ============================================================

export const TEST_TYPE_MAP: Record<string, ScoringType> = {
  similitudes:        'partial',
  vocabulaire:        'partial',
  information:        'dichotomic',
  cubes:              'time_bonus',
  matrices:           'dichotomic',
  balances:           'dichotomic',
  puzzles_visuels:    'dichotomic',
  empan_chiffres:     'span',
  arithmetique:       'time_bonus',
  memoire_images:     'dichotomic',
  code:               'speed',
  recherche_symboles: 'speed',
}

export const SCORING_TYPE_LABELS: Record<ScoringType, string> = {
  partial:    'Partiel 0/1/2',
  dichotomic: 'Dichotomique 0/1',
  time_bonus: 'Bonus temps',
  span:       'Empan',
  speed:      'Vitesse',
}

export const SCORING_TYPE_COLORS: Record<ScoringType, string> = {
  partial:    'bg-violet-100 text-violet-700',
  dichotomic: 'bg-blue-100 text-blue-700',
  time_bonus: 'bg-amber-100 text-amber-700',
  span:       'bg-emerald-100 text-emerald-700',
  speed:      'bg-rose-100 text-rose-700',
}
