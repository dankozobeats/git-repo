-- Simplification du système de notes

-- Ajouter des colonnes simples à habit_notes
ALTER TABLE habit_notes
ADD COLUMN IF NOT EXISTS content_text text DEFAULT '',
ADD COLUMN IF NOT EXISTS media jsonb DEFAULT '[]'::jsonb;

-- Les anciennes colonnes blocks et media_metadata peuvent rester pour compatibilité
-- mais on va utiliser les nouvelles à partir de maintenant
