-- Script pour insérer des trackables de test
-- IMPORTANT: Remplace 'YOUR_USER_ID' par ton vrai user_id

-- 1. Trouve ton user_id
-- SELECT id, email FROM auth.users;

-- 2. Copie l'ID et remplace-le dans la variable ci-dessous
-- Exemple: SET user_id = '123e4567-e89b-12d3-a456-426614174000';

-- Insertion de trackables de test
-- Remplace YOUR_USER_ID par ton user_id réel

-- Habitudes prioritaires
INSERT INTO public.trackables (user_id, type, name, icon, color, is_priority, target_per_day, unit)
VALUES
  ('YOUR_USER_ID', 'habit', 'Méditation', '🧘', '#6366f1', true, 1, 'session'),
  ('YOUR_USER_ID', 'habit', 'Exercice physique', '💪', '#10b981', true, 30, 'minutes'),
  ('YOUR_USER_ID', 'habit', 'Lecture', '📚', '#3b82f6', false, 20, 'pages');

-- États prioritaires
INSERT INTO public.trackables (user_id, type, name, icon, color, is_priority, description)
VALUES
  ('YOUR_USER_ID', 'state', 'Pulsion d''achat', '🛍️', '#f59e0b', true, 'Envie d''acheter quelque chose d''impulsif'),
  ('YOUR_USER_ID', 'state', 'Envie de sucre', '🍰', '#ef4444', true, 'Pulsion pour des aliments sucrés'),
  ('YOUR_USER_ID', 'state', 'Stress', '😰', '#8b5cf6', false, 'Sentiment de stress ou d''anxiété');

-- Vérification
SELECT
  type,
  name,
  icon,
  is_priority,
  target_per_day,
  unit
FROM public.trackables
WHERE user_id = 'YOUR_USER_ID'
ORDER BY is_priority DESC, type, name;
