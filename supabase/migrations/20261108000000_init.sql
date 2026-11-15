-- Drogi Mikołaju initial schema.
-- All access goes through the Next.js server (service connection), so RLS is enabled
-- without policies: the Supabase anon/authenticated roles cannot read anything directly.

create table profiles (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email)),
  display_name text not null,
  avatar jsonb not null default '{}'::jsonb,
  locale text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  screen_key text not null,
  title text not null,
  mode text not null check (mode in ('sync', 'async')),
  status text not null default 'open' check (status in ('open', 'ceremony', 'drawn', 'done')),
  locale text not null default 'en',
  timezone text not null default 'UTC',
  scheduled_at timestamptz,
  location text,
  online_url text,
  budget_amount numeric(10, 2),
  currency text not null default 'PLN',
  ceremony_step text not null default 'lobby',
  step_started_at timestamptz not null default now(),
  draw_commitment text,
  draw_salt text,
  drawn_at timestamptz,
  version bigint not null default 1,
  created_at timestamptz not null default now()
);

create table session_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id) on delete cascade,
  profile_id uuid references profiles (id) on delete set null,
  email text not null check (email = lower(email)),
  display_name text not null,
  avatar jsonb not null default '{}'::jsonb,
  role text not null default 'elf' check (role in ('host', 'elf')),
  status text not null default 'pending' check (status in ('invited', 'pending', 'approved', 'rejected')),
  is_remote boolean not null default false,
  email_verified boolean not null default false,
  profile_completed_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  unique (session_id, email)
);

create index session_participants_email_idx on session_participants (email);

create table exclusions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id) on delete cascade,
  giver_id uuid not null references session_participants (id) on delete cascade,
  receiver_id uuid not null references session_participants (id) on delete cascade,
  bidirectional boolean not null default true,
  created_at timestamptz not null default now(),
  unique (session_id, giver_id, receiver_id),
  check (giver_id <> receiver_id)
);

create table assignments (
  session_id uuid not null references sessions (id) on delete cascade,
  giver_id uuid not null references session_participants (id) on delete cascade,
  receiver_id uuid not null references session_participants (id) on delete cascade,
  revealed_at timestamptz,
  primary key (session_id, giver_id),
  unique (session_id, receiver_id),
  check (giver_id <> receiver_id)
);

create table auth_tokens (
  token_hash text primary key,
  purpose text not null check (purpose in ('login', 'participant')),
  email text not null,
  participant_id uuid references session_participants (id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table tts_cache (
  hash text primary key,
  text text not null,
  lang text not null,
  voice text not null,
  audio bytea,
  mime text,
  failed_at timestamptz,
  created_at timestamptz not null default now()
);

create table mail_log (
  id uuid primary key default gen_random_uuid(),
  recipient text not null,
  subject text not null,
  html text not null,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table sessions enable row level security;
alter table session_participants enable row level security;
alter table exclusions enable row level security;
alter table assignments enable row level security;
alter table auth_tokens enable row level security;
alter table tts_cache enable row level security;
alter table mail_log enable row level security;
