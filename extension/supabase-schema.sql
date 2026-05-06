-- Run this in your Supabase SQL editor to set up the Chalk database.

create table annotations (
  id uuid default gen_random_uuid() primary key,
  url text not null,
  data jsonb not null,
  type text not null check (type in ('drawing', 'text')),
  session_token text not null,
  created_at timestamptz default now()
);

create index annotations_url_idx on annotations (url);

alter table annotations enable row level security;
create policy "anyone can read"   on annotations for select using (true);
create policy "anyone can insert" on annotations for insert with check (true);

-- Reports table (founder monitors via Supabase dashboard for v0)
create table reports (
  id uuid default gen_random_uuid() primary key,
  annotation_id uuid references annotations (id) on delete cascade,
  reporter_token text not null,
  created_at timestamptz default now()
);

alter table reports enable row level security;
create policy "anyone can report" on reports for insert with check (true);
