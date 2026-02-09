-- Migration: Ajouter meta_json à la table habit_events
-- Pour stocker les détails des missions accomplies pour les habitudes de type compteur

ALTER TABLE public.habit_events 
ADD COLUMN IF NOT EXISTS meta_json jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.habit_events.meta_json IS 'Métadonnées de l''événement (ex: missions accomplies)';
