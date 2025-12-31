
create table if not exists public.scan_history (
  id uuid default gen_random_uuid() primary key,
  url text not null,
  grade text not null,
  score integer not null,
  vulnerabilities jsonb default '[]'::jsonb,
  meta_data jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Set up RLS (Row Level Security)
alter table public.scan_history enable row level security;

-- Allow anyone to read scans (public dashboard idea) or just authenticated?
-- For now, let's allow public read, and insert only via service role (Edge Function) or authenticated users.

create policy "Enable read access for all users"
on public.scan_history for select
using (true);

create policy "Enable insert for authenticated users and service role"
on public.scan_history for insert
with check (true);
