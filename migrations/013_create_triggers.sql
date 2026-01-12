-- Migration: Créer les fonctions et triggers (après que les tables existent)

-- Créer la fonction de mise à jour du timestamp
CREATE OR REPLACE FUNCTION update_notes_timestamp()
RETURNS TRIGGER AS $trigger$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$trigger$ LANGUAGE plpgsql;

-- Créer les triggers
CREATE TRIGGER habit_notes_timestamp
BEFORE UPDATE ON habit_notes
FOR EACH ROW
EXECUTE FUNCTION update_notes_timestamp();

CREATE TRIGGER habit_note_tasks_timestamp
BEFORE UPDATE ON habit_note_tasks
FOR EACH ROW
EXECUTE FUNCTION update_notes_timestamp();
