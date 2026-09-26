export const SCHEMA_SQL = `
create table if not exists protocols (
  id integer primary key autoincrement,
  slug text not null unique,
  name text not null,
  method text not null,
  category text not null,
  tagline text,
  description text not null,
  fasting_hours integer not null,
  eating_hours integer not null,
  badge_label text,
  badge_tone text not null default 'neutral',
  suggested_window_start text not null,
  suggested_window_end text not null,
  biomarkers text not null default '[]',
  popularity integer not null default 0,
  created_at text not null default (datetime('now'))
);

create table if not exists profiles (
  id integer primary key autoincrement,
  name text not null,
  email text,
  password_hash text,
  is_guest integer not null default 0,
  avatar_seed text,
  active_protocol_id integer references protocols(id) on delete set null,
  daily_target_hours integer not null default 16,
  water_goal_ml integer not null default 2500,
  start_weight_kg real,
  target_weight_kg real,
  created_at text not null default (datetime('now'))
);

create table if not exists sessions (
  token text primary key,
  profile_id integer not null references profiles(id) on delete cascade,
  created_at text not null,
  expires_at text not null
);

create index if not exists idx_sessions_profile on sessions (profile_id);

create table if not exists fasting_sessions (
  id integer primary key autoincrement,
  profile_id integer not null references profiles(id) on delete cascade,
  protocol_id integer not null references protocols(id),
  started_at text not null,
  ended_at text,
  target_hours integer not null,
  status text not null default 'active',
  break_food text,
  mood_note text,
  notes text
);

create index if not exists idx_fasting_sessions_started_at
  on fasting_sessions (started_at desc);

create index if not exists idx_fasting_sessions_profile
  on fasting_sessions (profile_id, started_at desc);

create table if not exists water_logs (
  id integer primary key autoincrement,
  profile_id integer not null references profiles(id) on delete cascade,
  logged_at text not null,
  amount_ml integer not null
);

create index if not exists idx_water_logs_logged_at on water_logs (logged_at desc);

create table if not exists mood_logs (
  id integer primary key autoincrement,
  profile_id integer not null references profiles(id) on delete cascade,
  logged_at text not null,
  level text not null,
  note text
);

create index if not exists idx_mood_logs_logged_at on mood_logs (logged_at desc);

create table if not exists weight_logs (
  id integer primary key autoincrement,
  profile_id integer not null references profiles(id) on delete cascade,
  logged_at text not null,
  weight_kg real not null
);

create index if not exists idx_weight_logs_logged_at on weight_logs (logged_at desc);

create table if not exists achievements (
  id integer primary key autoincrement,
  profile_id integer not null references profiles(id) on delete cascade,
  slug text not null,
  unlocked_at text not null,
  unique (profile_id, slug)
);

create table if not exists expert_tips (
  id integer primary key autoincrement,
  title text not null unique,
  body text not null
);
`
