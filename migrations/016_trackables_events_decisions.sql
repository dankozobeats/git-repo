-- Migration 016: Nouveau modèle Trackables + Events + Decisions
-- Compatible avec l'ancien système (habits reste intact)

-- ============================================
-- 1. TRACKABLES (Habitudes + États)
-- ============================================
CREATE TABLE IF NOT EXISTS public.trackables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Type: habit (action volontaire) ou state (signal observé)
  type text NOT NULL CHECK (type IN ('habit', 'state')),

  name text NOT NULL,
  description text,
  icon text,
  color text,

  -- Priorité (affiché dans "Priorités")
  is_priority boolean DEFAULT false,

  -- Pour les habitudes : cible quotidienne
  target_per_day integer,
  unit text, -- ex: "minutes", "pages", "fois"

  -- Métadonnées
  tags text[], -- ex: ["santé", "énergie"]

  -- Audit
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

CREATE INDEX IF NOT EXISTS trackables_user_id_idx ON public.trackables(user_id);
CREATE INDEX IF NOT EXISTS trackables_type_idx ON public.trackables(type);
CREATE INDEX IF NOT EXISTS trackables_priority_idx ON public.trackables(is_priority) WHERE is_priority = true;

-- ============================================
-- 2. EVENTS (Logs unifiés)
-- ============================================
CREATE TABLE IF NOT EXISTS public.trackable_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trackable_id uuid NOT NULL REFERENCES public.trackables(id) ON DELETE CASCADE,

  -- Type d'event
  kind text NOT NULL CHECK (kind IN ('check', 'observe')),
  -- check = validation d'habitude
  -- observe = observation d'état

  -- Timestamp
  occurred_at timestamptz NOT NULL DEFAULT now(),

  -- Valeur (pour les états: intensité 1-5, pour habitudes: quantité)
  value_int integer,
  value_float numeric,

  -- Métadonnées (contexte, tags, notes)
  meta_json jsonb DEFAULT '{}'::jsonb,
  -- Ex pour état: {"context": "stress", "trigger": "travail"}
  -- Ex pour habitude: {"duration_minutes": 30, "notes": "Bon rythme"}

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trackable_events_user_id_idx ON public.trackable_events(user_id);
CREATE INDEX IF NOT EXISTS trackable_events_trackable_id_idx ON public.trackable_events(trackable_id);
CREATE INDEX IF NOT EXISTS trackable_events_occurred_at_idx ON public.trackable_events(occurred_at DESC);
CREATE INDEX IF NOT EXISTS trackable_events_kind_idx ON public.trackable_events(kind);

-- ============================================
-- 3. DECISIONS (Réponses aux états)
-- ============================================
CREATE TABLE IF NOT EXISTS public.decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state_event_id uuid NOT NULL REFERENCES public.trackable_events(id) ON DELETE CASCADE,

  -- Type de décision
  decision text NOT NULL CHECK (decision IN ('resist', 'relapse', 'delay', 'replace', 'other')),
  -- resist = résisté avec succès
  -- relapse = craqué
  -- delay = reporté (ex: 10 min)
  -- replace = action de remplacement

  -- Montant (optionnel, pour achats)
  amount numeric,

  -- Délai (pour delay)
  delay_minutes integer,

  -- Action de remplacement (pour replace)
  replacement_action text,

  -- Métadonnées
  meta_json jsonb DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS decisions_user_id_idx ON public.decisions(user_id);
CREATE INDEX IF NOT EXISTS decisions_state_event_id_idx ON public.decisions(state_event_id);
CREATE INDEX IF NOT EXISTS decisions_decision_idx ON public.decisions(decision);
CREATE INDEX IF NOT EXISTS decisions_created_at_idx ON public.decisions(created_at DESC);

-- ============================================
-- 4. TRIGGERS
-- ============================================

-- Trigger updated_at pour trackables
CREATE OR REPLACE FUNCTION update_trackables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trackables_updated_at ON public.trackables;
CREATE TRIGGER trackables_updated_at
  BEFORE UPDATE ON public.trackables
  FOR EACH ROW
  EXECUTE FUNCTION update_trackables_updated_at();

-- ============================================
-- 5. RLS POLICIES
-- ============================================

ALTER TABLE public.trackables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trackable_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;

-- Trackables policies
DROP POLICY IF EXISTS trackables_select_own ON public.trackables;
CREATE POLICY trackables_select_own ON public.trackables
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS trackables_insert_own ON public.trackables;
CREATE POLICY trackables_insert_own ON public.trackables
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS trackables_update_own ON public.trackables;
CREATE POLICY trackables_update_own ON public.trackables
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS trackables_delete_own ON public.trackables;
CREATE POLICY trackables_delete_own ON public.trackables
  FOR DELETE USING (auth.uid() = user_id);

-- Trackable_events policies
DROP POLICY IF EXISTS trackable_events_select_own ON public.trackable_events;
CREATE POLICY trackable_events_select_own ON public.trackable_events
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS trackable_events_insert_own ON public.trackable_events;
CREATE POLICY trackable_events_insert_own ON public.trackable_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS trackable_events_update_own ON public.trackable_events;
CREATE POLICY trackable_events_update_own ON public.trackable_events
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS trackable_events_delete_own ON public.trackable_events;
CREATE POLICY trackable_events_delete_own ON public.trackable_events
  FOR DELETE USING (auth.uid() = user_id);

-- Decisions policies
DROP POLICY IF EXISTS decisions_select_own ON public.decisions;
CREATE POLICY decisions_select_own ON public.decisions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS decisions_insert_own ON public.decisions;
CREATE POLICY decisions_insert_own ON public.decisions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS decisions_update_own ON public.decisions;
CREATE POLICY decisions_update_own ON public.decisions
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS decisions_delete_own ON public.decisions;
CREATE POLICY decisions_delete_own ON public.decisions
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 6. VUES UTILES
-- ============================================

-- Vue pour les stats quotidiennes
CREATE OR REPLACE VIEW public.daily_stats AS
SELECT
  te.user_id,
  DATE(te.occurred_at) as date,
  COUNT(*) FILTER (WHERE te.kind = 'check') as habits_completed,
  COUNT(*) FILTER (WHERE d.decision = 'resist') as resistances,
  COUNT(*) FILTER (WHERE d.decision = 'relapse') as relapses,
  COALESCE(SUM(d.amount), 0) as total_amount_spent
FROM public.trackable_events te
LEFT JOIN public.decisions d ON d.state_event_id = te.id
GROUP BY te.user_id, DATE(te.occurred_at);

COMMENT ON VIEW public.daily_stats IS 'Stats quotidiennes agrégées (habitudes + décisions)';
