// src/types/index.ts

// ============================================================
// SUPABASE DATABASE TYPES
// ============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      test_configurations: {
        Row: TestConfiguration
        Insert: Omit<TestConfiguration, 'id' | 'updated_at'>
        Update: Partial<Omit<TestConfiguration, 'id'>>
      }
      flow_configurations: {
        Row: FlowConfiguration
        Insert: Omit<FlowConfiguration, 'id' | 'updated_at'>
        Update: Partial<Omit<FlowConfiguration, 'id'>>
      }
      items_library: {
        Row: ItemLibrary
        Insert: Omit<ItemLibrary, 'id' | 'created_at'>
        Update: Partial<Omit<ItemLibrary, 'id' | 'created_at'>>
      }
      clinical_comments: {
        Row: ClinicalComment
        Insert: Omit<ClinicalComment, 'id' | 'created_at'>
        Update: Partial<Omit<ClinicalComment, 'id' | 'created_at'>>
      }
      proposals: {
        Row: Proposal
        Insert: Omit<Proposal, 'id' | 'created_at'>
        Update: Partial<Omit<Proposal, 'id' | 'created_at'>>
      }
      proposal_votes: {
        Row: ProposalVote
        Insert: Omit<ProposalVote, 'voted_at'>
        Update: never
      }
      change_log: {
        Row: ChangeLogEntry
        Insert: Omit<ChangeLogEntry, 'id' | 'changed_at'>
        Update: never
      }
    }
    Views: Record<string, never>
    Functions: {
      get_user_role: {
        Args: Record<string, never>
        Returns: string
      }
    }
    Enums: Record<string, never>
  }
}

// ============================================================
// DOMAIN TYPES
// ============================================================

export type UserRole = 'admin' | 'clinician'
export type Specialty = 'psychiatre' | 'psychologue' | 'neuropsychologue' | 'chercheur'
export type ItemStatus = 'active' | 'review' | 'archived'
export type ItemType = 'verbal' | 'nonverbal' | 'numerical' | 'spatial'
export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'deployed'
export type CommentTargetType = 'test' | 'item' | 'config'
export type ChangeType = 'create' | 'update' | 'delete' | 'rollback' | 'deploy'
export type CompositeIndex = 'ICV' | 'IRP' | 'IMT' | 'IVT'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  specialty: Specialty | null
  institution: string | null
  is_active: boolean
  created_at: string
}

// ============================================================
// TEST CONFIGURATION TYPES
// ============================================================

export interface PerformanceThresholds {
  very_low: [number, number]
  low: [number, number]
  average: [number, number]
  high: [number, number]
  very_high: [number, number]
}

export interface RawScoreItem {
  item_id: string
  label: string
  max_score: number
  partial_score: number
  keywords: string[]
}

export interface TestConfigJson {
  name: string
  index: CompositeIndex
  discontinuation: number
  items: RawScoreItem[]
  thresholds: PerformanceThresholds
  weight: number
  notes: string
}

export interface TestConfiguration {
  id: string
  test_id: string
  config_json: TestConfigJson
  updated_by: string | null
  updated_at: string
  version: number
  is_active: boolean
}

// ============================================================
// FLOW CONFIGURATION TYPES
// ============================================================

export interface TestFlowItem {
  test_id: string
  order: number
  is_required: boolean
  display_condition: string | null
  time_limit_seconds: number | null
  intro_message: string
}

export interface TestGroup {
  group_id: string
  label: string
  test_ids: string[]
  max_duration_seconds: number | null
}

export interface FlowConfigJson {
  tests: TestFlowItem[]
  groups: TestGroup[]
}

export interface FlowConfiguration {
  id: string
  config_json: FlowConfigJson
  updated_by: string | null
  updated_at: string
  version: number
  is_active: boolean
}

// ============================================================
// ITEMS LIBRARY TYPES
// ============================================================

export interface VerbalItemContent {
  prompt: string
  example_answers: { text: string; score: number }[]
  cultural_notes: string
}

export interface NonVerbalItemContent {
  description: string
  image_url: string | null
  solution: string
}

export type ItemContent = VerbalItemContent | NonVerbalItemContent

export interface ItemLibrary {
  id: string
  test_id: string
  item_type: ItemType
  content_json: ItemContent
  expected_score: number
  difficulty_level: number
  tags: string[]
  region: string[]
  status: ItemStatus
  created_by: string | null
  created_at: string
}

// ============================================================
// COLLABORATION TYPES
// ============================================================

export interface ClinicalComment {
  id: string
  target_type: CommentTargetType
  target_id: string
  content: string
  author_id: string
  parent_id: string | null
  created_at: string
  author?: Profile
  replies?: ClinicalComment[]
}

export interface Proposal {
  id: string
  title: string
  description: string
  config_changes: Json
  proposed_by: string
  created_at: string
  status: ProposalStatus
  votes_for: number
  votes_against: number
  proposer?: Profile
}

export interface ProposalVote {
  proposal_id: string
  clinician_id: string
  vote: 'for' | 'against'
  comment: string | null
  voted_at: string
}

export interface ChangeLogEntry {
  id: string
  table_name: string
  record_id: string
  change_type: ChangeType
  old_value: Json | null
  new_value: Json | null
  changed_by: string | null
  changed_at: string
  author?: Profile
}

// ============================================================
// ANALYTICS TYPES
// ============================================================

export interface ScoreDistribution {
  test_id: string
  bucket: string
  count: number
  percentage: number
}

export interface ItemReliability {
  test_id: string
  item_id: string
  item_label: string
  correct_rate: number
  partial_rate: number
  fail_rate: number
}

export interface DiscontinuationAnalysis {
  test_id: string
  item_id: string
  discontinuation_count: number
  discontinuation_rate: number
}

// ============================================================
// UI TYPES
// ============================================================

export type BadgeVariant = 'green' | 'orange' | 'red' | 'blue' | 'gray'

export interface SelectOption {
  value: string
  label: string
}

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  message: string
}

// ============================================================
// WAIS-IV TEST REGISTRY
// ============================================================

export const WAIS_TESTS: { id: string; name: string; index: CompositeIndex }[] = [
  { id: 'similitudes',       name: 'Similitudes',        index: 'ICV' },
  { id: 'vocabulaire',       name: 'Vocabulaire',         index: 'ICV' },
  { id: 'information',       name: 'Information',         index: 'ICV' },
  { id: 'cubes',             name: 'Cubes',               index: 'IRP' },
  { id: 'matrices',          name: 'Matrices',            index: 'IRP' },
  { id: 'balances',          name: 'Balances',            index: 'IRP' },
  { id: 'puzzles_visuels',   name: 'Puzzles Visuels',     index: 'IRP' },
  { id: 'empan_chiffres',    name: 'Empan Chiffres',      index: 'IMT' },
  { id: 'arithmetique',      name: 'Arithmétique',        index: 'IMT' },
  { id: 'memoire_images',    name: 'Mémoire Images',      index: 'IMT' },
  { id: 'code',              name: 'Code',                index: 'IVT' },
  { id: 'recherche_symboles',name: 'Recherche Symboles',  index: 'IVT' },
]

export const INDEX_COLORS: Record<CompositeIndex, string> = {
  ICV: 'blue',
  IRP: 'purple',
  IMT: 'green',
  IVT: 'orange',
}
