-- Create categories table
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_categories_user on public.categories(user_id);

-- Add category_id to habits
alter table public.habits
  add column if not exists category_id uuid null references public.categories(id) on delete set null;

create index if not exists idx_habits_category_id on public.habits(category_id);
