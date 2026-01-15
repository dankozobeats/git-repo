-- Script d'installation du système Trackables
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Appliquer la migration principale
\i migrations/016_trackables_events_decisions.sql

-- 2. Créer des exemples de trackables (optionnel - commenter si pas besoin)
-- IMPORTANT: Remplacer YOUR_USER_ID par votre vrai user_id
-- Vous pouvez le trouver avec: SELECT id FROM auth.users WHERE email = 'votre@email.com';

/*
-- Exemple d'habitudes
INSERT INTO public.trackables (user_id, type, name, icon, color, is_priority, target_per_day, unit)
VALUES
  ('YOUR_USER_ID', 'habit', 'Méditation', '🧘', '#6366f1', true, 1, 'session'),
  ('YOUR_USER_ID', 'habit', 'Exercice physique', '💪', '#10b981', true, 30, 'minutes'),
  ('YOUR_USER_ID', 'habit', 'Lecture', '📚', '#3b82f6', false, 20, 'pages');

-- Exemple d'états à surveiller
INSERT INTO public.trackables (user_id, type, name, icon, color, is_priority)
VALUES
  ('YOUR_USER_ID', 'state', 'Pulsion d''achat', '🛍️', '#f59e0b', true),
  ('YOUR_USER_ID', 'state', 'Envie de sucre', '🍰', '#ef4444', true),
  ('YOUR_USER_ID', 'state', 'Stress', '😰', '#8b5cf6', false);
*/

-- 3. Vérifier que tout est bien créé
SELECT 'Trackables table created' as status,
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trackables') as exists;

SELECT 'Trackable_events table created' as status,
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trackable_events') as exists;

SELECT 'Decisions table created' as status,
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'decisions') as exists;

SELECT 'Daily_stats view created' as status,
       EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'daily_stats') as exists;
