-- Migration: 002_add_habit_events_columns.sql
-- Purpose: Ensure `habit_events` has `occurred_at` (timestamptz) and `event_date` (date).
-- This file is idempotent: it can be safely executed multiple times.

-- Usage:
--  - Paste into Supabase SQL editor (Project → SQL → New query) and click Run,
--  - Or run with psql / supabase CLI against your production DB.

BEGIN;

-- Add `occurred_at` column if missing (used by server and UI to display last event time)
ALTER TABLE IF EXISTS public.habit_events
  ADD COLUMN IF NOT EXISTS occurred_at timestamptz;

-- Add `event_date` column if missing (used for efficient daily grouping/queries)
ALTER TABLE IF EXISTS public.habit_events
  ADD COLUMN IF NOT EXISTS event_date date;

-- Backfill `event_date` from `occurred_at` when possible
UPDATE public.habit_events
SET event_date = (occurred_at::date)
WHERE (event_date IS NULL) AND (occurred_at IS NOT NULL);

-- Create a composite index for typical queries (habit_id + event_date)
CREATE INDEX IF NOT EXISTS idx_habit_events_habit_id_event_date
  ON public.habit_events (habit_id, event_date);

COMMIT;

-- Verification queries (run after migration):
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'habit_events' ORDER BY column_name;
-- SELECT COUNT(*) FROM public.habit_events WHERE occurred_at IS NULL;
