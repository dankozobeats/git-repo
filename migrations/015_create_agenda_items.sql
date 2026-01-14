-- Migration: 015_create_agenda_items.sql
-- Purpose: Agenda items (rendez-vous/tâches) liés optionnellement à une habitude.

CREATE TABLE IF NOT EXISTS public.agenda_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id uuid REFERENCES public.habits(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  scheduled_date date NOT NULL,
  scheduled_time time,
  reminder_enabled boolean NOT NULL DEFAULT false,
  reminder_offset_minutes integer,
  is_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agenda_items_user_id_idx ON public.agenda_items(user_id);
CREATE INDEX IF NOT EXISTS agenda_items_scheduled_date_idx ON public.agenda_items(scheduled_date);

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION update_agenda_items_updated_at()
RETURNS TRIGGER AS $trigger$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$trigger$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS agenda_items_updated_at ON public.agenda_items;
CREATE TRIGGER agenda_items_updated_at
BEFORE UPDATE ON public.agenda_items
FOR EACH ROW
EXECUTE FUNCTION update_agenda_items_updated_at();

-- RLS policies
ALTER TABLE IF EXISTS public.agenda_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'agenda_items'
      AND policyname = 'agenda_items_select_own'
  ) THEN
    CREATE POLICY agenda_items_select_own
      ON public.agenda_items
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'agenda_items'
      AND policyname = 'agenda_items_insert_own'
  ) THEN
    CREATE POLICY agenda_items_insert_own
      ON public.agenda_items
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'agenda_items'
      AND policyname = 'agenda_items_update_own'
  ) THEN
    CREATE POLICY agenda_items_update_own
      ON public.agenda_items
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'agenda_items'
      AND policyname = 'agenda_items_delete_own'
  ) THEN
    CREATE POLICY agenda_items_delete_own
      ON public.agenda_items
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;
