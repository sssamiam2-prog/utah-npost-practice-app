create table if not exists public.practice_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.practice_state enable row level security;

drop policy if exists "Users read own practice state" on public.practice_state;
drop policy if exists "Users insert own practice state" on public.practice_state;
drop policy if exists "Users update own practice state" on public.practice_state;

create policy "Users read own practice state"
  on public.practice_state for select
  using (auth.uid() = user_id);

create policy "Users insert own practice state"
  on public.practice_state for insert
  with check (auth.uid() = user_id);

create policy "Users update own practice state"
  on public.practice_state for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
