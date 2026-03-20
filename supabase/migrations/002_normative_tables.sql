-- Migration 002: Normative tables for WAIS-IV scaled score lookup
-- Allows admins to enter official age-normed conversion tables (raw score → scaled score 1-19)

CREATE TABLE IF NOT EXISTS normative_tables (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id     TEXT NOT NULL,
  age_group   TEXT NOT NULL,        -- e.g. '16-17', '18-19', '20-24', '25-29', '30-34', ...
  raw_score   INTEGER NOT NULL CHECK (raw_score >= 0),
  scaled_score INTEGER NOT NULL CHECK (scaled_score BETWEEN 1 AND 19),
  percentile   INTEGER NOT NULL CHECK (percentile BETWEEN 1 AND 99),
  updated_by  UUID REFERENCES auth.users(id),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (test_id, age_group, raw_score)
);

-- Index for fast lookups during session scoring
CREATE INDEX IF NOT EXISTS normative_tables_lookup_idx
  ON normative_tables (test_id, age_group, raw_score);

-- Row-level security
ALTER TABLE normative_tables ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read normative tables
CREATE POLICY "normative_tables_read" ON normative_tables
  FOR SELECT TO authenticated USING (true);

-- Only admins can insert/update/delete
CREATE POLICY "normative_tables_admin_write" ON normative_tables
  FOR ALL TO authenticated
  USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

-- ============================================================
-- Seed: minimal example normative data (adults 20-24) for Similitudes
-- Real values should be entered by clinicians from published WAIS-IV tables
-- ============================================================

INSERT INTO normative_tables (test_id, age_group, raw_score, scaled_score, percentile) VALUES
  ('similitudes', '20-24',  0,  1,  1),
  ('similitudes', '20-24',  4,  4,  2),
  ('similitudes', '20-24',  8,  6,  9),
  ('similitudes', '20-24', 12,  8, 25),
  ('similitudes', '20-24', 16, 10, 50),
  ('similitudes', '20-24', 20, 12, 75),
  ('similitudes', '20-24', 26, 14, 91),
  ('similitudes', '20-24', 32, 16, 98),
  ('similitudes', '20-24', 38, 18, 99),
  ('similitudes', '20-24', 42, 19, 99)
ON CONFLICT (test_id, age_group, raw_score) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE normative_tables IS
  'WAIS-IV normative conversion tables: raw score → scaled score (1-19) and percentile, by age group. '
  'Must be populated by clinical administrator using published normative data. '
  'Age groups follow WAIS-IV manual: 16-17, 18-19, 20-24, 25-29, 30-34, 35-44, 45-54, 55-64, 65-69, 70-74, 75-79, 80-84, 85-90.';
