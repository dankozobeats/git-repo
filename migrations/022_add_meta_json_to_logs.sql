-- Migration: Ajouter meta_json à la table logs
-- Pour stocker les détails des missions accomplies pour les habitudes classiques

ALTER TABLE public.logs 
ADD COLUMN IF NOT EXISTS meta_json jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.logs.meta_json IS 'Métadonnées de l''événement (ex: missions accomplies)';
