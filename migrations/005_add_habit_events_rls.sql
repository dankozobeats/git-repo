-- Migration: 005_add_habit_events_rls.sql
-- Purpose: Allow owners to select/insert/update/delete their habit events.

ALTER TABLE IF EXISTS public.habit_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'habit_events'
      AND policyname = 'habit_events_select_own'
  ) THEN
    CREATE POLICY habit_events_select_own
      ON public.habit_events
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'habit_events'
      AND policyname = 'habit_events_insert_own'
  ) THEN
    CREATE POLICY habit_events_insert_own
      ON public.habit_events
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'habit_events'
      AND policyname = 'habit_events_update_own'
  ) THEN
    CREATE POLICY habit_events_update_own
      ON public.habit_events
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'habit_events'
      AND policyname = 'habit_events_delete_own'
  ) THEN
    CREATE POLICY habit_events_delete_own
      ON public.habit_events
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;
