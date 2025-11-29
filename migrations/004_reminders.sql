create extension if not exists pgcrypto;

-- Fonction de mise à jour du timestamp (idempotente)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

-- Table des rappels
create table if not exists public.reminders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  channel text not null check (channel in ('push','email','inapp')),
  schedule text not null check (schedule in ('daily','weekly')),
  time_local text not null, -- 'HH:MM'
  weekday int null check (weekday between 0 and 6),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists reminders_user_habit_channel_idx
  on public.reminders (user_id, habit_id, channel);

-- Trigger (création conditionnelle) : utilisation de DO + EXECUTE sans nested $$
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'reminders_updated_at'
      AND n.nspname = 'public'
      AND c.relname = 'reminders'
  ) THEN
    EXECUTE 'CREATE TRIGGER reminders_updated_at BEFORE UPDATE ON public.reminders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();';
  END IF;
END$$;

-- Table des subscriptions push
create table if not exists public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists push_subscriptions_user_endpoint_idx
  on public.push_subscriptions (user_id, endpoint);
