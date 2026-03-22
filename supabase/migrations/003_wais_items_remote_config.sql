-- Migration 003: wais_items (IRT params) + remote_config + extend change_log
-- Run via Supabase Dashboard > SQL Editor or `supabase db push`

-- ============================================================
-- TABLE: wais_items
-- Items WAIS-IV avec paramètres IRT (complète items_library)
-- Contient les vrais items du test tels qu'ils apparaissent
-- dans la Flutter app, avec paramètres IRT calibrés.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wais_items (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id              TEXT NOT NULL,
  item_number          INTEGER NOT NULL,
  stimulus             TEXT NOT NULL,
  scoring_type         TEXT NOT NULL CHECK (scoring_type IN ('dichotomic', 'partial', 'time_bonus', 'digit_span', 'speed')),
  expected_responses   JSONB NOT NULL DEFAULT '[]',  -- [{answer, score, keywords[]}]
  irt_a                FLOAT NOT NULL DEFAULT 1.0,   -- discrimination
  irt_b                FLOAT NOT NULL DEFAULT 0.0,   -- difficulty (logit)
  time_limit_seconds   INTEGER,
  start_item           INTEGER DEFAULT 1,
  discontinue_after    INTEGER,
  composite_index      TEXT CHECK (composite_index IN ('ICV', 'IRP', 'IMT', 'IVT')),
  is_active            BOOLEAN NOT NULL DEFAULT true,
  notes                TEXT,
  updated_by           UUID REFERENCES public.profiles(id),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (test_id, item_number)
);

CREATE INDEX IF NOT EXISTS idx_wais_items_test ON public.wais_items(test_id);
CREATE INDEX IF NOT EXISTS idx_wais_items_active ON public.wais_items(test_id, is_active);

ALTER TABLE public.wais_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wais_items_read" ON public.wais_items
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "wais_items_admin_write" ON public.wais_items
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- ============================================================
-- TABLE: remote_config
-- Paramètres lus par la Flutter app au démarrage
-- Permet de modifier le comportement de l'app sans rebuild
-- ============================================================
CREATE TABLE IF NOT EXISTS public.remote_config (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  description TEXT,
  updated_by  UUID REFERENCES public.profiles(id),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.remote_config ENABLE ROW LEVEL SECURITY;

-- Flutter app lit en anonyme (anon key)
CREATE POLICY "remote_config_public_read" ON public.remote_config
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "remote_config_admin_write" ON public.remote_config
  FOR ALL TO authenticated
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- ============================================================
-- EXTEND: change_log — ajouter ai_suggested + status
-- ============================================================
ALTER TABLE public.change_log
  ADD COLUMN IF NOT EXISTS ai_suggested BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'deployed'
    CHECK (status IN ('draft', 'approved', 'deployed', 'reverted'));

-- ============================================================
-- EXTEND: item_annotations (alias de clinical_comments pour les items)
-- Vue pour faciliter les annotations sur les wais_items
-- ============================================================
CREATE OR REPLACE VIEW public.item_annotations AS
  SELECT
    id,
    target_id AS item_id,
    content,
    author_id,
    parent_id,
    created_at,
    -- annotation_type dérivé du préfixe du contenu si présent
    CASE
      WHEN content LIKE '[FLAG]%' THEN 'flag'
      WHEN content LIKE '[IA]%'   THEN 'ai_generated'
      ELSE 'clinical_note'
    END AS annotation_type
  FROM public.clinical_comments
  WHERE target_type = 'item';

-- ============================================================
-- DONNÉES INITIALES: remote_config par défaut
-- ============================================================
INSERT INTO public.remote_config (key, value, description) VALUES
  ('app_version_required', '"1.0.0"', 'Version minimale de la Flutter app requise'),
  ('test_flow_enabled', 'true', 'Activer le flux de test complet'),
  ('oral_test_enabled', 'true', 'Activer le test oral dans le flux'),
  ('irt_adaptive_enabled', 'false', 'Activer le mode adaptatif IRT (expérimental)'),
  ('scoring_source', '"local"', 'Source des tables normatives: "local" ou "remote"'),
  ('ai_chat_enabled', 'true', 'Activer le chat IA dans la Flutter app'),
  ('session_save_enabled', 'true', 'Activer la sauvegarde locale des sessions')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- SEED: wais_items — Similitudes (21 items)
-- ============================================================
INSERT INTO public.wais_items (test_id, item_number, stimulus, scoring_type, expected_responses, irt_a, irt_b, composite_index, discontinue_after) VALUES
  ('similitudes', 1,  'Chat — Chien',         'partial', '[{"answer":"animaux","score":2},{"answer":"animaux domestiques","score":2},{"answer":"mammifères","score":2},{"answer":"ils ont 4 pattes","score":1},{"answer":"poils","score":1}]', 0.8, -2.5, 'ICV', 3),
  ('similitudes', 2,  'Blanc — Noir',         'partial', '[{"answer":"couleurs","score":2},{"answer":"nuances","score":2},{"answer":"opposés","score":1},{"answer":"contraires","score":1}]', 0.9, -2.0, 'ICV', 3),
  ('similitudes', 3,  'Crayon — Stylo',       'partial', '[{"answer":"instruments d''écriture","score":2},{"answer":"outils d''écriture","score":2},{"answer":"on écrit avec","score":1},{"answer":"ils ont une pointe","score":1}]', 1.0, -1.8, 'ICV', 3),
  ('similitudes', 4,  'Piano — Guitare',      'partial', '[{"answer":"instruments de musique","score":2},{"answer":"instruments","score":2},{"answer":"pour faire de la musique","score":1},{"answer":"ils ont des cordes ou des touches","score":1}]', 1.0, -1.5, 'ICV', 3),
  ('similitudes', 5,  'Pomme — Banane',       'partial', '[{"answer":"fruits","score":2},{"answer":"fruits comestibles","score":2},{"answer":"aliments","score":1},{"answer":"ça se mange","score":1}]', 1.1, -1.5, 'ICV', 3),
  ('similitudes', 6,  'Table — Chaise',       'partial', '[{"answer":"meubles","score":2},{"answer":"mobilier","score":2},{"answer":"furniture","score":2},{"answer":"pour s''asseoir et manger","score":1}]', 1.1, -1.2, 'ICV', 3),
  ('similitudes', 7,  'Colère — Joie',        'partial', '[{"answer":"émotions","score":2},{"answer":"sentiments","score":2},{"answer":"états affectifs","score":2},{"answer":"on les ressent","score":1}]', 1.2, -1.0, 'ICV', 3),
  ('similitudes', 8,  'Arbre — Fleur',        'partial', '[{"answer":"plantes","score":2},{"answer":"végétaux","score":2},{"answer":"êtres vivants","score":1},{"answer":"ça pousse","score":1}]', 1.2, -0.8, 'ICV', 3),
  ('similitudes', 9,  'Montagne — Lac',       'partial', '[{"answer":"paysages naturels","score":2},{"answer":"éléments géographiques","score":2},{"answer":"nature","score":1},{"answer":"dans la nature","score":1}]', 1.3, -0.5, 'ICV', 3),
  ('similitudes', 10, 'Marteau — Vis',        'partial', '[{"answer":"outils","score":2},{"answer":"accessoires de bricolage","score":2},{"answer":"matériaux de construction","score":1},{"answer":"pour construire","score":1}]', 1.3, -0.3, 'ICV', 3),
  ('similitudes', 11, 'Diamant — Rubis',      'partial', '[{"answer":"pierres précieuses","score":2},{"answer":"gemmes","score":2},{"answer":"minéraux précieux","score":2},{"answer":"bijoux","score":1}]', 1.4, 0.0, 'ICV', 3),
  ('similitudes', 12, 'Poème — Roman',        'partial', '[{"answer":"œuvres littéraires","score":2},{"answer":"genres littéraires","score":2},{"answer":"littérature","score":2},{"answer":"écrits","score":1}]', 1.4, 0.3, 'ICV', 3),
  ('similitudes', 13, 'Thermomètre — Horloge','partial', '[{"answer":"instruments de mesure","score":2},{"answer":"appareils de mesure","score":2},{"answer":"ils mesurent quelque chose","score":1}]', 1.5, 0.5, 'ICV', 3),
  ('similitudes', 14, 'Rivière — Route',      'partial', '[{"answer":"voies de communication","score":2},{"answer":"chemins","score":2},{"answer":"voies de passage","score":2},{"answer":"permettent de circuler","score":1}]', 1.5, 0.8, 'ICV', 3),
  ('similitudes', 15, 'Électricité — Vapeur', 'partial', '[{"answer":"sources d''énergie","score":2},{"answer":"formes d''énergie","score":2},{"answer":"énergie","score":2},{"answer":"peuvent produire de l''énergie","score":1}]', 1.6, 1.0, 'ICV', 3),
  ('similitudes', 16, 'Sculpture — Symphonie','partial', '[{"answer":"œuvres d''art","score":2},{"answer":"formes d''expression artistique","score":2},{"answer":"créations artistiques","score":2},{"answer":"art","score":1}]', 1.6, 1.3, 'ICV', 3),
  ('similitudes', 17, 'Proverbe — Fable',     'partial', '[{"answer":"formes littéraires avec une morale","score":2},{"answer":"textes avec une leçon","score":2},{"answer":"enseignements","score":1},{"answer":"morale","score":1}]', 1.7, 1.5, 'ICV', 3),
  ('similitudes', 18, 'Alcool — Cannabis',    'partial', '[{"answer":"substances psychoactives","score":2},{"answer":"drogues","score":2},{"answer":"substances altérant la conscience","score":2},{"answer":"substances addictives","score":1}]', 1.7, 1.8, 'ICV', 3),
  ('similitudes', 19, 'Honte — Fierté',       'partial', '[{"answer":"sentiments moraux","score":2},{"answer":"émotions auto-évaluatives","score":2},{"answer":"émotions liées au jugement","score":2},{"answer":"émotions","score":1}]', 1.8, 2.0, 'ICV', 3),
  ('similitudes', 20, 'Entropie — Chaos',     'partial', '[{"answer":"désordre","score":2},{"answer":"absence d''ordre","score":2},{"answer":"concepts de désorganisation","score":2},{"answer":"augmentation du désordre","score":1}]', 1.8, 2.2, 'ICV', 3),
  ('similitudes', 21, 'Paradoxe — Contradiction', 'partial', '[{"answer":"oppositions logiques","score":2},{"answer":"affirmations contradictoires","score":2},{"answer":"incohérences","score":2},{"answer":"problèmes logiques","score":1}]', 1.9, 2.5, 'ICV', 3)
ON CONFLICT (test_id, item_number) DO NOTHING;

-- ============================================================
-- SEED: wais_items — Vocabulaire (30 items, abrégé)
-- ============================================================
INSERT INTO public.wais_items (test_id, item_number, stimulus, scoring_type, expected_responses, irt_a, irt_b, composite_index) VALUES
  ('vocabulaire', 1,  'Vélo',       'partial', '[{"answer":"moyen de transport à deux roues","score":2},{"answer":"transport","score":1}]', 0.8, -2.0, 'ICV'),
  ('vocabulaire', 2,  'Couteau',    'partial', '[{"answer":"outil tranchant","score":2},{"answer":"ustensile de cuisine","score":2},{"answer":"pour couper","score":1}]', 0.9, -1.8, 'ICV'),
  ('vocabulaire', 3,  'Chapeau',    'partial', '[{"answer":"coiffure","score":2},{"answer":"couvre-chef","score":2},{"answer":"accessoire vestimentaire","score":2}]', 1.0, -1.5, 'ICV'),
  ('vocabulaire', 4,  'Lettre',     'partial', '[{"answer":"message écrit","score":2},{"answer":"écrit envoyé à quelqu''un","score":2},{"answer":"correspondance","score":2}]', 1.0, -1.3, 'ICV'),
  ('vocabulaire', 5,  'Parapluie',  'partial', '[{"answer":"abri contre la pluie","score":2},{"answer":"accessoire pour se protéger de la pluie","score":2}]', 1.1, -1.0, 'ICV'),
  ('vocabulaire', 6,  'Courage',    'partial', '[{"answer":"capacité à affronter la peur","score":2},{"answer":"bravoure","score":2},{"answer":"force face au danger","score":2}]', 1.2, -0.5, 'ICV'),
  ('vocabulaire', 7,  'Lunettes',   'partial', '[{"answer":"instrument optique correcteur de la vue","score":2},{"answer":"verres correcteurs","score":2}]', 1.1, -0.8, 'ICV'),
  ('vocabulaire', 8,  'Apprenti',   'partial', '[{"answer":"personne qui apprend un métier","score":2},{"answer":"débutant qui se forme","score":2}]', 1.2, 0.0, 'ICV'),
  ('vocabulaire', 9,  'Fable',      'partial', '[{"answer":"récit imaginaire avec une morale","score":2},{"answer":"histoire avec une leçon","score":2}]', 1.3, 0.3, 'ICV'),
  ('vocabulaire', 10, 'Téméraire',  'partial', '[{"answer":"qui prend des risques inconsidérés","score":2},{"answer":"imprudent","score":1},{"answer":"courageux à l''excès","score":2}]', 1.4, 0.5, 'ICV')
ON CONFLICT (test_id, item_number) DO NOTHING;

-- ============================================================
-- SEED: wais_items — Information (10 items abrégés)
-- ============================================================
INSERT INTO public.wais_items (test_id, item_number, stimulus, scoring_type, expected_responses, irt_a, irt_b, composite_index, discontinue_after) VALUES
  ('information', 1,  'Combien de jours y a-t-il dans une semaine ?', 'dichotomic', '[{"answer":"7","score":1},{"answer":"sept","score":1}]', 0.8, -3.0, 'ICV', 5),
  ('information', 2,  'De quelle couleur est le ciel par temps clair ?', 'dichotomic', '[{"answer":"bleu","score":1}]', 0.8, -2.5, 'ICV', 5),
  ('information', 3,  'Combien y a-t-il de mois dans une année ?',      'dichotomic', '[{"answer":"12","score":1},{"answer":"douze","score":1}]', 0.9, -2.0, 'ICV', 5),
  ('information', 4,  'Quelle est la capitale de la France ?',          'dichotomic', '[{"answer":"Paris","score":1}]', 1.0, -1.5, 'ICV', 5),
  ('information', 5,  'Combien font 4 x 4 ?',                          'dichotomic', '[{"answer":"16","score":1},{"answer":"seize","score":1}]', 1.0, -1.0, 'ICV', 5),
  ('information', 6,  'Qui a peint la Joconde ?',                       'dichotomic', '[{"answer":"Léonard de Vinci","score":1},{"answer":"Da Vinci","score":1}]', 1.2, 0.0, 'ICV', 5),
  ('information', 7,  'Quelle planète est la plus proche du Soleil ?',  'dichotomic', '[{"answer":"Mercure","score":1}]', 1.3, 0.5, 'ICV', 5),
  ('information', 8,  'Qui a développé la théorie de la relativité ?',  'dichotomic', '[{"answer":"Einstein","score":1},{"answer":"Albert Einstein","score":1}]', 1.4, 0.8, 'ICV', 5),
  ('information', 9,  'Quelle est la formule chimique de l''eau ?',     'dichotomic', '[{"answer":"H2O","score":1}]', 1.4, 1.0, 'ICV', 5),
  ('information', 10, 'Qui a écrit Don Quichotte ?',                    'dichotomic', '[{"answer":"Cervantes","score":1},{"answer":"Miguel de Cervantes","score":1}]', 1.5, 1.5, 'ICV', 5)
ON CONFLICT (test_id, item_number) DO NOTHING;
