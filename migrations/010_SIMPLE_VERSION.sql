-- Migration: Système de notes enrichies (SIMPLE VERSION - Sans contraintes complexes)

-- Table principale des notes
CREATE TABLE IF NOT EXISTS habit_notes (
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

-- Table des tâches
CREATE TABLE IF NOT EXISTS habit_note_tasks (
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

-- Index
CREATE INDEX IF NOT EXISTS habit_notes_habit_id_idx ON habit_notes(habit_id);
CREATE INDEX IF NOT EXISTS habit_notes_user_id_idx ON habit_notes(user_id);
CREATE INDEX IF NOT EXISTS habit_note_tasks_note_id_idx ON habit_note_tasks(note_id);
CREATE INDEX IF NOT EXISTS habit_note_tasks_habit_id_idx ON habit_note_tasks(habit_id);
CREATE INDEX IF NOT EXISTS habit_note_tasks_user_id_idx ON habit_note_tasks(user_id);

-- Triggers simples
CREATE OR REPLACE FUNCTION update_notes_timestamp()
RETURNS TRIGGER AS $t$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$t$ LANGUAGE plpgsql;

CREATE TRIGGER habit_notes_timestamp
BEFORE UPDATE ON habit_notes
FOR EACH ROW
EXECUTE FUNCTION update_notes_timestamp();

CREATE TRIGGER habit_note_tasks_timestamp
BEFORE UPDATE ON habit_note_tasks
FOR EACH ROW
EXECUTE FUNCTION update_notes_timestamp();
