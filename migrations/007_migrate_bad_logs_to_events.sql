-- Migration: 007_migrate_bad_logs_to_events.sql
-- Purpose: Normalize bad habit activity into habit_events and remove legacy logs.

-- Insert missing events from logs for bad habits.
INSERT INTO public.habit_events (habit_id, user_id, event_date, occurred_at)
SELECT
  l.habit_id,
  l.user_id,
  l.completed_date AS event_date,
  COALESCE(l.created_at, l.completed_date::timestamptz) AS occurred_at
FROM public.logs l
JOIN public.habits h ON h.id = l.habit_id
WHERE h.type = 'bad'
  AND NOT EXISTS (
    SELECT 1
    FROM public.habit_events e
    WHERE e.habit_id = l.habit_id
      AND e.user_id = l.user_id
      AND e.event_date = l.completed_date
      AND e.occurred_at = COALESCE(l.created_at, l.completed_date::timestamptz)
  );

-- Remove migrated logs for bad habits to avoid double counting.
DELETE FROM public.logs l
USING public.habits h
WHERE h.id = l.habit_id
  AND h.type = 'bad'
  AND EXISTS (
    SELECT 1
    FROM public.habit_events e
    WHERE e.habit_id = l.habit_id
      AND e.user_id = l.user_id
      AND e.event_date = l.completed_date
      AND e.occurred_at = COALESCE(l.created_at, l.completed_date::timestamptz)
  );
