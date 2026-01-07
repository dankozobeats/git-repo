-- Migration: 006_add_habits_rls.sql
-- Purpose: Allow owners to select/insert/update/delete their habits.

ALTER TABLE IF EXISTS public.habits ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'habits'
      AND policyname = 'habits_select_own'
  ) THEN
    CREATE POLICY habits_select_own
      ON public.habits
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'habits'
      AND policyname = 'habits_insert_own'
  ) THEN
    CREATE POLICY habits_insert_own
      ON public.habits
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'habits'
      AND policyname = 'habits_update_own'
  ) THEN
    CREATE POLICY habits_update_own
      ON public.habits
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'habits'
      AND policyname = 'habits_delete_own'
  ) THEN
    CREATE POLICY habits_delete_own
      ON public.habits
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;
