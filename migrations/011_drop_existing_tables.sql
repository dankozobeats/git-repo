-- Migration: Supprimer les tables existantes avant de les recréer

-- Supprimer les triggers
DROP TRIGGER IF EXISTS habit_notes_updated_at ON habit_notes;
DROP TRIGGER IF EXISTS habit_note_tasks_updated_at ON habit_note_tasks;
DROP TRIGGER IF EXISTS habit_note_tasks_completed_at ON habit_note_tasks;

-- Supprimer les fonctions
DROP FUNCTION IF EXISTS update_habit_notes_updated_at();
DROP FUNCTION IF EXISTS update_habit_note_tasks_updated_at();
DROP FUNCTION IF EXISTS auto_set_completed_at();

-- Supprimer les tables (CASCADE pour supprimer aussi les dépendances)
DROP TABLE IF EXISTS habit_note_tasks CASCADE;
DROP TABLE IF EXISTS habit_notes CASCADE;
