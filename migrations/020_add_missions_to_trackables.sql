-- Migration 020: Ajouter le support des missions aux trackables
-- Permet d'avoir une checklist d'objectifs précis pour chaque habitude/état

ALTER TABLE public.trackables
ADD COLUMN IF NOT EXISTS missions jsonb DEFAULT '[]'::jsonb;

-- Commentaire pour expliquer le format : [{ "id": "uuid", "title": "Faire X", "is_active": true }]
COMMENT ON COLUMN public.trackables.missions IS 'Checklist d''objectifs précis pour ce trackable';
