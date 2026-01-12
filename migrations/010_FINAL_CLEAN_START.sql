-- Migration: Système de notes enrichies
-- NETTOYAGE COMPLET PUIS CRÉATION

-- ÉTAPE 1: Supprimer TOUS les triggers d'abord
DROP TRIGGER IF EXISTS habit_notes_timestamp ON habit_notes;
DROP TRIGGER IF EXISTS habit_note_tasks_timestamp ON habit_note_tasks;
DROP TRIGGER IF EXISTS habit_note_tasks_completed_at ON habit_note_tasks;
DROP TRIGGER IF EXISTS habit_notes_updated_at ON habit_notes;
DROP TRIGGER IF EXISTS habit_note_tasks_updated_at ON habit_note_tasks;

-- ÉTAPE 2: Supprimer TOUTES les fonctions
DROP FUNCTION IF EXISTS update_notes_timestamp() CASCADE;
DROP FUNCTION IF EXISTS update_habit_notes_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_habit_note_tasks_updated_at() CASCADE;
DROP FUNCTION IF EXISTS auto_set_completed_at() CASCADE;

-- ÉTAPE 3: Supprimer les tables (dans le bon ordre - enfants d'abord)
DROP TABLE IF EXISTS habit_note_tasks CASCADE;
DROP TABLE IF EXISTS habit_notes CASCADE;

-- PAUSE: Vérifier que tout est supprimé
-- Si vous voyez encore des erreurs, allez dans Supabase UI > Table Editor
-- et supprimez manuellement les tables habit_notes et habit_note_tasks

-- ÉTAPE 4: Créer la table des notes
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

-- ÉTAPE 5: Créer la table des tâches
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

-- ÉTAPE 6: Créer les index
CREATE INDEX habit_notes_habit_id_idx ON habit_notes(habit_id);
CREATE INDEX habit_notes_user_id_idx ON habit_notes(user_id);
CREATE INDEX habit_note_tasks_note_id_idx ON habit_note_tasks(note_id);
CREATE INDEX habit_note_tasks_habit_id_idx ON habit_note_tasks(habit_id);
CREATE INDEX habit_note_tasks_user_id_idx ON habit_note_tasks(user_id);

-- ÉTAPE 7: Créer la fonction de mise à jour du timestamp
CREATE FUNCTION update_notes_timestamp()
RETURNS TRIGGER AS $trigger$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$trigger$ LANGUAGE plpgsql;

-- ÉTAPE 8: Créer les triggers
CREATE TRIGGER habit_notes_timestamp
BEFORE UPDATE ON habit_notes
FOR EACH ROW
EXECUTE FUNCTION update_notes_timestamp();

CREATE TRIGGER habit_note_tasks_timestamp
BEFORE UPDATE ON habit_note_tasks
FOR EACH ROW
EXECUTE FUNCTION update_notes_timestamp();
