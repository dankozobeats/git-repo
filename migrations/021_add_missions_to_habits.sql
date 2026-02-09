-- Migration: Ajouter le champ missions à la table habits
-- Permet de définir des sous-objectifs pour chaque habitude (bonne ou mauvaise)

ALTER TABLE habits 
ADD COLUMN IF NOT EXISTS missions jsonb DEFAULT '[]'::jsonb;

-- Commentaire pour documentation
COMMENT ON COLUMN habits.missions IS 'Liste des missions quotidiennes (sous-tâches) au format JSONB';
