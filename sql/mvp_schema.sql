-- Romantic Journey MVP schema (Supabase/Postgres)
-- Covers all writes emitted by current frontend + supabase-client.js

create extension if not exists pgcrypto;

-- 1) users
create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  nickname text not null unique,
  password text not null,
  first_login boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_profiles (
  user_id uuid primary key references app_users(id) on delete cascade,
  avatar text,
  birthday date,
  mbti text,
  zodiac text,
  pace text,
  budget_level text,
  wake_up text,
  social text,
  skills text[] not null default '{}',
  bio text,
  updated_at timestamptz not null default now()
);

-- 2) trips
create table if not exists trips (
  id text primary key,
  user_id uuid not null references app_users(id) on delete cascade,
  destination text not null,
  depart_date date,
  return_date date,
  budget numeric(12,2) not null default 0,
  tags text[] not null default '{}',
  spots text[] not null default '{}',
  itinerary text not null default '',
  pace text,
  wake_up text,
  social text,
  countries text[] not null default '{}',
  badges jsonb not null default '[]'::jsonb,
  review jsonb not null default '{"score":5.0,"count":1,"highlights":[]}'::jsonb,
  trust jsonb not null default '{"score":4.5,"completion":90,"verified":false}'::jsonb,
  like_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_trips_user_id on trips(user_id);
create index if not exists idx_trips_created_at on trips(created_at desc);

create table if not exists trip_comments (
  id text primary key,
  trip_id text not null references trips(id) on delete cascade,
  user_id uuid not null references app_users(id) on delete cascade,
  reply_to_nickname text,
  content text not null,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_trip_comments_trip_id on trip_comments(trip_id);

create table if not exists trip_likes (
  trip_id text not null references trips(id) on delete cascade,
  user_id uuid not null references app_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

create table if not exists trip_comment_likes (
  comment_id text not null references trip_comments(id) on delete cascade,
  user_id uuid not null references app_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

-- 3) diaries/media
create table if not exists media_posts (
  id text primary key,
  user_id uuid not null references app_users(id) on delete cascade,
  media_type text not null check (media_type in ('图片','视频')),
  location text,
  cover text,
  caption text,
  checkin text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index if not exists idx_media_posts_user_id on media_posts(user_id);

create table if not exists media_comments (
  id text primary key,
  media_post_id text not null references media_posts(id) on delete cascade,
  user_id uuid not null references app_users(id) on delete cascade,
  reply_to_nickname text,
  content text not null,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_media_comments_post_id on media_comments(media_post_id);

create table if not exists media_likes (
  media_post_id text not null references media_posts(id) on delete cascade,
  user_id uuid not null references app_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (media_post_id, user_id)
);

create table if not exists media_comment_likes (
  comment_id text not null references media_comments(id) on delete cascade,
  user_id uuid not null references app_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

-- 4) social
create table if not exists user_follows (
  follower_id uuid not null references app_users(id) on delete cascade,
  followee_id uuid not null references app_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create table if not exists user_blocks (
  blocker_id uuid not null references app_users(id) on delete cascade,
  blocked_id uuid not null references app_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

-- 5) chat
create table if not exists chats (
  id text primary key,
  chat_type text not null check (chat_type in ('dm','group')),
  name text,
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists chat_members (
  chat_id text not null references chats(id) on delete cascade,
  user_id uuid not null references app_users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (chat_id, user_id)
);

create table if not exists chat_messages (
  id text primary key,
  chat_id text not null references chats(id) on delete cascade,
  sender_id uuid not null references app_users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- 6) read state + admin event stream
create table if not exists user_read_state (
  user_id uuid not null references app_users(id) on delete cascade,
  scope text not null,
  last_read_at timestamptz not null default now(),
  primary key (user_id, scope)
);

create table if not exists admin_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references app_users(id) on delete set null,
  user_nickname text,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_admin_events_type_created on admin_events(event_type, created_at desc);

-- 7) update timestamp trigger
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_app_users_updated_at on app_users;
create trigger trg_app_users_updated_at
before update on app_users
for each row execute function set_updated_at();

drop trigger if exists trg_user_profiles_updated_at on user_profiles;
create trigger trg_user_profiles_updated_at
before update on user_profiles
for each row execute function set_updated_at();

drop trigger if exists trg_trips_updated_at on trips;
create trigger trg_trips_updated_at
before update on trips
for each row execute function set_updated_at();

drop trigger if exists trg_media_posts_updated_at on media_posts;
create trigger trg_media_posts_updated_at
before update on media_posts
for each row execute function set_updated_at();
