-- supabase/migrations/001_admin_schema.sql
-- Mentality Admin — Schéma base de données clinique
-- Appliquer via Supabase Dashboard > SQL Editor ou `supabase db push`

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE: profiles
-- Étend auth.users avec les données cliniques du praticien
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('admin', 'clinician')),
  specialty     TEXT CHECK (specialty IN ('psychiatre', 'psychologue', 'neuropsychologue', 'chercheur')),
  institution   TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger : crée automatiquement un profil lors de l'inscription via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'clinician')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- TABLE: test_configurations
-- Règles de scoring pour chacun des 12 tests WAIS-IV
-- ============================================================
CREATE TABLE IF NOT EXISTS public.test_configurations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id     TEXT NOT NULL,
  config_json JSONB NOT NULL DEFAULT '{}',
  updated_by  UUID REFERENCES public.profiles(id),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  version     INTEGER NOT NULL DEFAULT 1,
  is_active   BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_test_configurations_test_id ON public.test_configurations(test_id);
CREATE INDEX IF NOT EXISTS idx_test_configurations_active  ON public.test_configurations(test_id, is_active);

-- ============================================================
-- TABLE: flow_configurations
-- Ordre et conditions d'affichage des tests
-- ============================================================
CREATE TABLE IF NOT EXISTS public.flow_configurations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_json JSONB NOT NULL DEFAULT '{}',
  updated_by  UUID REFERENCES public.profiles(id),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  version     INTEGER NOT NULL DEFAULT 1,
  is_active   BOOLEAN NOT NULL DEFAULT true
);

-- ============================================================
-- TABLE: items_library
-- Items des tests verbaux et non-verbaux
-- ============================================================
CREATE TABLE IF NOT EXISTS public.items_library (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id          TEXT NOT NULL,
  item_type        TEXT NOT NULL CHECK (item_type IN ('verbal', 'nonverbal', 'numerical', 'spatial')),
  content_json     JSONB NOT NULL DEFAULT '{}',
  expected_score   INTEGER NOT NULL DEFAULT 0,
  difficulty_level INTEGER NOT NULL CHECK (difficulty_level BETWEEN 1 AND 5),
  tags             TEXT[] NOT NULL DEFAULT '{}',
  region           TEXT[] NOT NULL DEFAULT '{}',
  status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'review', 'archived')),
  created_by       UUID REFERENCES public.profiles(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_items_library_test_id ON public.items_library(test_id);
CREATE INDEX IF NOT EXISTS idx_items_library_status  ON public.items_library(status);
CREATE INDEX IF NOT EXISTS idx_items_library_tags    ON public.items_library USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_items_library_region  ON public.items_library USING GIN(region);

-- ============================================================
-- TABLE: clinical_comments
-- Commentaires cliniques sur tests, items et configurations
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clinical_comments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_type TEXT NOT NULL CHECK (target_type IN ('test', 'item', 'config')),
  target_id   TEXT NOT NULL,
  content     TEXT NOT NULL,
  author_id   UUID NOT NULL REFERENCES public.profiles(id),
  parent_id   UUID REFERENCES public.clinical_comments(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clinical_comments_target ON public.clinical_comments(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_clinical_comments_author ON public.clinical_comments(author_id);

-- ============================================================
-- TABLE: proposals
-- Propositions de modification soumises au vote
-- ============================================================
CREATE TABLE IF NOT EXISTS public.proposals (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title          TEXT NOT NULL,
  description    TEXT NOT NULL,
  config_changes JSONB NOT NULL DEFAULT '{}',
  proposed_by    UUID NOT NULL REFERENCES public.profiles(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'deployed')),
  votes_for      INTEGER NOT NULL DEFAULT 0,
  votes_against  INTEGER NOT NULL DEFAULT 0
);

-- Table des votes individuels (empêche les votes multiples)
CREATE TABLE IF NOT EXISTS public.proposal_votes (
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  clinician_id UUID NOT NULL REFERENCES public.profiles(id),
  vote        TEXT NOT NULL CHECK (vote IN ('for', 'against')),
  comment     TEXT,
  voted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (proposal_id, clinician_id)
);

-- ============================================================
-- TABLE: change_log
-- Journal immuable de toutes les modifications de configuration
-- ============================================================
CREATE TABLE IF NOT EXISTS public.change_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name  TEXT NOT NULL,
  record_id   UUID NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('create', 'update', 'delete', 'rollback', 'deploy')),
  old_value   JSONB,
  new_value   JSONB,
  changed_by  UUID REFERENCES public.profiles(id),
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_change_log_table   ON public.change_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_change_log_changed ON public.change_log(changed_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flow_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_library       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_comments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_votes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.change_log          ENABLE ROW LEVEL SECURITY;

-- Helper : vérifie le rôle de l'utilisateur courant
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE sql STABLE
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ---- profiles ----
CREATE POLICY "Cliniciens peuvent voir tous les profils actifs"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Clinicien peut modifier son propre profil"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Admin peut gérer tous les profils"
  ON public.profiles FOR ALL
  TO authenticated
  USING (public.get_user_role() = 'admin');

-- ---- test_configurations ----
CREATE POLICY "Lecture libre pour les cliniciens authentifiés"
  ON public.test_configurations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Seul l'admin peut modifier les configurations"
  ON public.test_configurations FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Seul l'admin peut mettre à jour les configurations"
  ON public.test_configurations FOR UPDATE
  TO authenticated
  USING (public.get_user_role() = 'admin');

-- ---- flow_configurations ----
CREATE POLICY "Lecture libre pour les cliniciens authentifiés"
  ON public.flow_configurations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Seul l'admin peut modifier le flow"
  ON public.flow_configurations FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "Seul l'admin peut mettre à jour le flow"
  ON public.flow_configurations FOR UPDATE
  TO authenticated
  USING (public.get_user_role() = 'admin');

-- ---- items_library ----
CREATE POLICY "Lecture libre des items actifs"
  ON public.items_library FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Cliniciens peuvent créer des items"
  ON public.items_library FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Clinicien peut modifier ses propres items, admin peut tout modifier"
  ON public.items_library FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR public.get_user_role() = 'admin');

-- ---- clinical_comments ----
CREATE POLICY "Tous les cliniciens peuvent lire les commentaires"
  ON public.clinical_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Cliniciens peuvent créer des commentaires"
  ON public.clinical_comments FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "Clinicien peut modifier ses propres commentaires"
  ON public.clinical_comments FOR UPDATE
  TO authenticated
  USING (author_id = auth.uid());

CREATE POLICY "Clinicien peut supprimer ses propres commentaires"
  ON public.clinical_comments FOR DELETE
  TO authenticated
  USING (author_id = auth.uid() OR public.get_user_role() = 'admin');

-- ---- proposals ----
CREATE POLICY "Tous les cliniciens peuvent lire les propositions"
  ON public.proposals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Cliniciens peuvent créer des propositions"
  ON public.proposals FOR INSERT
  TO authenticated
  WITH CHECK (proposed_by = auth.uid());

CREATE POLICY "Admin peut mettre à jour le statut des propositions"
  ON public.proposals FOR UPDATE
  TO authenticated
  USING (public.get_user_role() = 'admin' OR proposed_by = auth.uid());

-- ---- proposal_votes ----
CREATE POLICY "Cliniciens peuvent voir tous les votes"
  ON public.proposal_votes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Cliniciens peuvent voter une fois par proposition"
  ON public.proposal_votes FOR INSERT
  TO authenticated
  WITH CHECK (clinician_id = auth.uid());

-- ---- change_log ----
CREATE POLICY "Tous les cliniciens peuvent lire le journal"
  ON public.change_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Seul l'admin peut écrire dans le journal"
  ON public.change_log FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() = 'admin');

-- ============================================================
-- DONNÉES INITIALES — 12 tests WAIS-IV
-- ============================================================
-- À insérer via la console Supabase après création des tables
-- en tant qu'utilisateur admin.
-- INSERT INTO public.test_configurations (test_id, config_json, version) VALUES
--   ('similitudes',      '{"name":"Similitudes","index":"ICV","discontinuation":3,"items":[],"thresholds":{"very_low":[0,5],"low":[6,8],"average":[9,11],"high":[12,14],"very_high":[15,33]},"weight":1.0,"notes":""}', 1),
--   ('vocabulaire',      '{"name":"Vocabulaire","index":"ICV","discontinuation":5,"items":[],"thresholds":{"very_low":[0,8],"low":[9,12],"average":[13,17],"high":[18,21],"very_high":[22,68]},"weight":1.0,"notes":""}', 1),
--   ('information',      '{"name":"Information","index":"ICV","discontinuation":5,"items":[],"thresholds":{"very_low":[0,8],"low":[9,12],"average":[13,17],"high":[18,21],"very_high":[22,26]},"weight":1.0,"notes":""}', 1),
--   ('cubes',            '{"name":"Cubes","index":"IRP","discontinuation":3,"items":[],"thresholds":{"very_low":[0,20],"low":[21,30],"average":[31,45],"high":[46,55],"very_high":[56,68]},"weight":1.0,"notes":""}', 1),
--   ('matrices',         '{"name":"Matrices","index":"IRP","discontinuation":4,"items":[],"thresholds":{"very_low":[0,6],"low":[7,10],"average":[11,16],"high":[17,22],"very_high":[23,26]},"weight":1.0,"notes":""}', 1),
--   ('balances',         '{"name":"Balances","index":"IRP","discontinuation":4,"items":[],"thresholds":{"very_low":[0,6],"low":[7,10],"average":[11,16],"high":[17,22],"very_high":[23,34]},"weight":1.0,"notes":""}', 1),
--   ('puzzles_visuels',  '{"name":"Puzzles Visuels","index":"IRP","discontinuation":3,"items":[],"thresholds":{"very_low":[0,5],"low":[6,9],"average":[10,14],"high":[15,18],"very_high":[19,26]},"weight":1.0,"notes":""}', 1),
--   ('empan_chiffres',   '{"name":"Empan Chiffres","index":"IMT","discontinuation":2,"items":[],"thresholds":{"very_low":[0,8],"low":[9,12],"average":[13,17],"high":[18,21],"very_high":[22,48]},"weight":1.0,"notes":""}', 1),
--   ('arithmetique',     '{"name":"Arithmétique","index":"IMT","discontinuation":3,"items":[],"thresholds":{"very_low":[0,6],"low":[7,10],"average":[11,15],"high":[16,19],"very_high":[20,34]},"weight":1.0,"notes":""}', 1),
--   ('memoire_images',   '{"name":"Mémoire Images","index":"IMT","discontinuation":3,"items":[],"thresholds":{"very_low":[0,6],"low":[7,10],"average":[11,15],"high":[16,19],"very_high":[20,48]},"weight":1.0,"notes":""}', 1),
--   ('code',             '{"name":"Code","index":"IVT","discontinuation":0,"items":[],"thresholds":{"very_low":[0,20],"low":[21,35],"average":[36,50],"high":[51,65],"very_high":[66,119]},"weight":1.0,"notes":""}', 1),
--   ('recherche_symboles','{"name":"Recherche Symboles","index":"IVT","discontinuation":0,"items":[],"thresholds":{"very_low":[0,10],"low":[11,16],"average":[17,23],"high":[24,30],"very_high":[31,60]},"weight":1.0,"notes":""}', 1);
