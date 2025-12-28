-- Create a table to track rate limits
create table if not exists rate_limits (
  id uuid default gen_random_uuid() primary key,
  ip_address text,
  user_id uuid references auth.users(id),
  endpoint text not null,
  request_count int default 1,
  last_request_at timestamptz default now(),
  reset_at timestamptz default (now() + interval '1 minute')
);

-- Add index for faster lookups
create index if not exists rate_limits_lookup_idx on rate_limits (ip_address, user_id, endpoint);

-- Enable RLS (though this table is mainly for Service Role use)
alter table rate_limits enable row level security;

-- Only service role should likely write to this, but we can allow reads if needed?
-- For now, keep it restricted.
