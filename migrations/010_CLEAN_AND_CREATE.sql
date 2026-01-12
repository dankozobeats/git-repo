-- Migration: Système de notes enrichies
-- ÉTAPE 1: Nettoyer les anciennes tentatives
-- ÉTAPE 2: Créer les nouvelles tables

-- Supprimer les anciennes versions si elles existent
DROP TABLE IF EXISTS habit_note_tasks CASCADE;
DROP TABLE IF EXISTS habit_notes CASCADE;
DROP FUNCTION IF EXISTS update_notes_timestamp() CASCADE;
DROP FUNCTION IF EXISTS update_habit_notes_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_habit_note_tasks_updated_at() CASCADE;
DROP FUNCTION IF EXISTS auto_set_completed_at() CASCADE;

-- Créer la table des notes
CREATE TABLE habit_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Note sans titre',
  is_pinned boolean DEFAULT false,
  blocks jsonb NOT NULL DEFAULT '[]'::jsonb,
  media_metadata jsonb DEFAULT '{}'::jsonb,
  plain_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Créer la table des tâches
CREATE TABLE habit_note_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES habit_notes(id) ON DELETE CASCADE,
  habit_id uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  source_type text,
  source_url text,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index pour performance
CREATE INDEX habit_notes_habit_id_idx ON habit_notes(habit_id);
CREATE INDEX habit_notes_user_id_idx ON habit_notes(user_id);
CREATE INDEX habit_note_tasks_note_id_idx ON habit_note_tasks(note_id);
CREATE INDEX habit_note_tasks_habit_id_idx ON habit_note_tasks(habit_id);
CREATE INDEX habit_note_tasks_user_id_idx ON habit_note_tasks(user_id);

-- Fonction pour mettre à jour updated_at
CREATE FUNCTION update_notes_timestamp()
RETURNS TRIGGER AS $t$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$t$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER habit_notes_timestamp
BEFORE UPDATE ON habit_notes
FOR EACH ROW
EXECUTE FUNCTION update_notes_timestamp();

CREATE TRIGGER habit_note_tasks_timestamp
BEFORE UPDATE ON habit_note_tasks
FOR EACH ROW
EXECUTE FUNCTION update_notes_timestamp();
