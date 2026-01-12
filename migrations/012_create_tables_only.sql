-- Migration: Créer les tables uniquement (sans triggers)

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

-- Créer les index
CREATE INDEX habit_notes_habit_id_idx ON habit_notes(habit_id);
CREATE INDEX habit_notes_user_id_idx ON habit_notes(user_id);
CREATE INDEX habit_note_tasks_note_id_idx ON habit_note_tasks(note_id);
CREATE INDEX habit_note_tasks_habit_id_idx ON habit_note_tasks(habit_id);
CREATE INDEX habit_note_tasks_user_id_idx ON habit_note_tasks(user_id);
