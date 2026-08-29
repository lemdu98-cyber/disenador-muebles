create table if not exists public.furniture_designs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 160),
  furniture_type text not null,
  config jsonb not null,
  schema_version integer not null default 1 check (schema_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists furniture_designs_user_updated_idx
  on public.furniture_designs (user_id, updated_at desc);

create or replace function public.set_furniture_design_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists furniture_designs_set_updated_at
on public.furniture_designs;

create trigger furniture_designs_set_updated_at
before update on public.furniture_designs
for each row
execute function public.set_furniture_design_updated_at();

alter table public.furniture_designs
enable row level security;

grant select, insert, update, delete
on table public.furniture_designs
to authenticated;

drop policy if exists "Users can view their own furniture designs"
on public.furniture_designs;

create policy "Users can view their own furniture designs"
on public.furniture_designs
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own furniture designs"
on public.furniture_designs;

create policy "Users can create their own furniture designs"
on public.furniture_designs
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update their own furniture designs"
on public.furniture_designs;

create policy "Users can update their own furniture designs"
on public.furniture_designs
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own furniture designs"
on public.furniture_designs;

create policy "Users can delete their own furniture designs"
on public.furniture_designs
for delete
to authenticated
using ((select auth.uid()) = user_id);
