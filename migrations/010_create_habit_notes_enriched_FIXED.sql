-- Migration: Système de notes enrichies (block-based) pour les habitudes
-- Version compatible Supabase (sans $$ dollar quotes)

-- Table principale des notes
CREATE TABLE IF NOT EXISTS habit_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,

  -- Métadonnées de base
  title text NOT NULL DEFAULT 'Note sans titre',
  is_pinned boolean DEFAULT false,

  -- Contenu structuré en blocks (JSON)
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Cache des métadonnées des médias pour performance
  media_metadata jsonb DEFAULT '{}'::jsonb,

  -- Texte plein pour recherche (sera ajouté après car colonne GENERATED ne marche pas toujours)
  plain_text text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table des tâches extraites des notes (vidéos, articles à regarder/lire)
CREATE TABLE IF NOT EXISTS habit_note_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES habit_notes(id) ON DELETE CASCADE,
  habit_id uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,

  -- Contenu de la tâche
  title text NOT NULL,
  description text,

  -- Source (vidéo, article, etc.)
  source_type text CHECK (source_type IN ('video', 'article', 'custom')),
  source_url text,

  -- État de la tâche
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  due_date date,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS habit_notes_habit_id_idx ON habit_notes(habit_id);
CREATE INDEX IF NOT EXISTS habit_notes_user_id_idx ON habit_notes(user_id);
CREATE INDEX IF NOT EXISTS habit_notes_is_pinned_idx ON habit_notes(is_pinned) WHERE is_pinned = true;

CREATE INDEX IF NOT EXISTS habit_note_tasks_note_id_idx ON habit_note_tasks(note_id);
CREATE INDEX IF NOT EXISTS habit_note_tasks_habit_id_idx ON habit_note_tasks(habit_id);
CREATE INDEX IF NOT EXISTS habit_note_tasks_user_id_idx ON habit_note_tasks(user_id);
CREATE INDEX IF NOT EXISTS habit_note_tasks_completed_idx ON habit_note_tasks(is_completed, due_date);

-- Fonction pour mettre à jour updated_at sur habit_notes
CREATE OR REPLACE FUNCTION update_habit_notes_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $func$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$func$;

CREATE TRIGGER habit_notes_updated_at
  BEFORE UPDATE ON habit_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_habit_notes_updated_at();

-- Fonction pour mettre à jour updated_at sur habit_note_tasks
CREATE OR REPLACE FUNCTION update_habit_note_tasks_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $func$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$func$;

CREATE TRIGGER habit_note_tasks_updated_at
  BEFORE UPDATE ON habit_note_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_habit_note_tasks_updated_at();

-- Fonction pour auto-remplir completed_at quand is_completed passe à true
CREATE OR REPLACE FUNCTION auto_set_completed_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $func$
BEGIN
  IF NEW.is_completed = true AND OLD.is_completed = false THEN
    NEW.completed_at = now();
  ELSIF NEW.is_completed = false THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$func$;

CREATE TRIGGER habit_note_tasks_completed_at
  BEFORE UPDATE ON habit_note_tasks
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_completed_at();
