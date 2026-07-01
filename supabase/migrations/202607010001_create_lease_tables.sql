create extension if not exists pgcrypto;

create table if not exists public.lease_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  filename text not null,
  summary text not null default '',
  flags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.lease_analyses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.dispute_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists lease_analyses_user_created_idx
  on public.lease_analyses(user_id, created_at desc);

create index if not exists chat_messages_analysis_created_idx
  on public.chat_messages(analysis_id, created_at);

create index if not exists chat_messages_user_created_idx
  on public.chat_messages(user_id, created_at);

create index if not exists dispute_messages_user_created_idx
  on public.dispute_messages(user_id, created_at);

alter table public.lease_analyses enable row level security;
alter table public.chat_messages enable row level security;
alter table public.dispute_messages enable row level security;

drop policy if exists "Users can read their lease analyses" on public.lease_analyses;
create policy "Users can read their lease analyses"
  on public.lease_analyses for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their lease analyses" on public.lease_analyses;
create policy "Users can insert their lease analyses"
  on public.lease_analyses for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their lease analyses" on public.lease_analyses;
create policy "Users can update their lease analyses"
  on public.lease_analyses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their lease analyses" on public.lease_analyses;
create policy "Users can delete their lease analyses"
  on public.lease_analyses for delete
  using (auth.uid() = user_id);

drop policy if exists "Users can read their lease chat messages" on public.chat_messages;
create policy "Users can read their lease chat messages"
  on public.chat_messages for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their lease chat messages" on public.chat_messages;
create policy "Users can insert their lease chat messages"
  on public.chat_messages for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.lease_analyses
      where lease_analyses.id = chat_messages.analysis_id
        and lease_analyses.user_id = auth.uid()
    )
  );

drop policy if exists "Users can read their dispute messages" on public.dispute_messages;
create policy "Users can read their dispute messages"
  on public.dispute_messages for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their dispute messages" on public.dispute_messages;
create policy "Users can insert their dispute messages"
  on public.dispute_messages for insert
  with check (auth.uid() = user_id);
