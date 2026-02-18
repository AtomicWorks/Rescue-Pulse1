

-- Run this script in your Supabase SQL Editor to create the necessary tables and policies

create table if not exists public.alerts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null,
  user_name text not null,
  user_avatar text,
  category text not null,
  description text not null,
  lat double precision not null,
  lng double precision not null,
  status text default 'active',
  responders jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  severity text default 'Medium',
  is_emergency boolean default true,
  is_anonymous boolean default false
);

-- Add column if it doesn't exist (Migration helper)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name='alerts' and column_name='is_anonymous') then
    alter table public.alerts add column is_anonymous boolean default false;
  end if;
end $$;

-- Messages Table for Direct Messaging
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid not null,
  sender_name text not null,
  sender_avatar text,
  receiver_id uuid not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_read boolean default false
);

-- Comments Table for Alerts
create table if not exists public.comments (
  id uuid default gen_random_uuid() primary key,
  alert_id uuid not null references public.alerts(id) on delete cascade,
  user_id uuid not null,
  user_name text not null,
  user_avatar text,
  text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Profiles Table for public user info (skills, etc)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  avatar text,
  skills text[]
);

-- Votes Table for Up/Down votes
create table if not exists public.votes (
  id uuid default gen_random_uuid() primary key,
  alert_id uuid not null references public.alerts(id) on delete cascade,
  user_id uuid not null,
  vote_type integer not null check (vote_type in (1, -1)),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(alert_id, user_id)
);

-- Add comment_count and remove alert_messages if exists
drop table if exists public.alert_messages;

-- Add vote_score, upvote_count, comment_count columns
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name='alerts' and column_name='vote_score') then
    alter table public.alerts add column vote_score integer default 0;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='alerts' and column_name='upvote_count') then
    alter table public.alerts add column upvote_count integer default 0;
  end if;
  if not exists (select 1 from information_schema.columns where table_name='alerts' and column_name='comment_count') then
    alter table public.alerts add column comment_count integer default 0;
  end if;
end $$;

-- Enable Row Level Security (RLS)
alter table public.alerts enable row level security;
alter table public.messages enable row level security;
alter table public.comments enable row level security;
alter table public.profiles enable row level security;
alter table public.votes enable row level security;
alter table public.alert_messages enable row level security;

-- Drop existing policies to ensure clean state and avoid conflicts
drop policy if exists "Everyone can read alerts" on public.alerts;
drop policy if exists "Authenticated users can insert alerts" on public.alerts;
drop policy if exists "Authenticated users can update alerts" on public.alerts;
drop policy if exists "Users can update their own alerts" on public.alerts;
drop policy if exists "Users can delete their own alerts" on public.alerts;

drop policy if exists "Users can read their own messages" on public.messages;
drop policy if exists "Users can send messages" on public.messages;
drop policy if exists "Users can update their own messages" on public.messages;

drop policy if exists "Everyone can read comments" on public.comments;
drop policy if exists "Authenticated users can insert comments" on public.comments;
drop policy if exists "Users can update their own comments" on public.comments;
drop policy if exists "Users can delete their own comments" on public.comments;
drop policy if exists "Alert owner can delete comments" on public.comments;

drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

drop policy if exists "Everyone can read votes" on public.votes;
drop policy if exists "Authenticated users can vote" on public.votes;
drop policy if exists "Users can update their vote" on public.votes;
drop policy if exists "Users can remove their vote" on public.votes;

drop policy if exists "Alert owner and responders can view" on public.alert_messages;
drop policy if exists "Alert owner and responders can insert" on public.alert_messages;

-- Alerts Policies
create policy "Everyone can read alerts" 
on public.alerts for select 
using (true);

create policy "Authenticated users can insert alerts" 
on public.alerts for insert 
with check (auth.role() = 'authenticated');

-- Key Policy for updating name on posts
create policy "Users can update their own alerts" 
on public.alerts for update 
using (auth.uid() = user_id);

create policy "Users can delete their own alerts" 
on public.alerts for delete 
using (auth.uid() = user_id);

-- Messages Policies
create policy "Users can read their own messages" 
on public.messages for select 
using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send messages" 
on public.messages for insert 
with check (auth.uid() = sender_id);

-- Key Policy for updating name on messages
create policy "Users can update their own messages" 
on public.messages for update 
using (auth.uid() = sender_id);

-- Comments Policies
create policy "Everyone can read comments" 
on public.comments for select 
using (true);

create policy "Authenticated users can insert comments" 
on public.comments for insert 
with check (auth.role() = 'authenticated');

-- Key Policy for updating name on comments
create policy "Users can update their own comments" 
on public.comments for update 
using (auth.uid() = user_id);

create policy "Users can delete their own comments" 
on public.comments for delete 
using (auth.uid() = user_id);

create policy "Alert owner can delete comments" 
on public.comments for delete 
using (
  exists (
    select 1 from public.alerts 
    where alerts.id = comments.alert_id 
    and alerts.user_id = auth.uid()
  )
);

-- Profiles Policies
create policy "Public profiles are viewable by everyone" 
on public.profiles for select 
using (true);

create policy "Users can insert their own profile" 
on public.profiles for insert 
with check (auth.uid() = id);

create policy "Users can update own profile" 
on public.profiles for update 
using (auth.uid() = id);

-- Votes Policies
create policy "Everyone can read votes" 
on public.votes for select 
using (true);

create policy "Authenticated users can vote" 
on public.votes for insert 
with check (auth.role() = 'authenticated');

create policy "Users can update their vote" 
on public.votes for update 
using (auth.uid() = user_id);

create policy "Users can remove their vote" 
on public.votes for delete 
using (auth.uid() = user_id);

);

create policy "Alert owner and responders can insert" 
on public.alert_messages for insert 
with check (
  exists (
    select 1 from public.alerts a
    where a.id = alert_messages.alert_id
    and (
      a.user_id = auth.uid() 
      or 
      a.responders @> jsonb_build_array(auth.uid()::text)
    )
  )
);

-- CRITICAL: Enable Realtime
do $$
begin
  -- Alerts Realtime
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'alerts'
  ) then
    alter publication supabase_realtime add table public.alerts;
  end if;

  -- Messages Realtime
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;

  -- Comments Realtime
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'comments'
  ) then
    alter publication supabase_realtime add table public.comments;
  end if;

  -- Votes Realtime
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'votes'
  ) then
    alter publication supabase_realtime add table public.votes;
  end if;

  -- Alert Messages Realtime
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'alert_messages'
  ) then
    alter publication supabase_realtime add table public.alert_messages;
  end if;
end $$;

-- Trigger to maintain vote_score and upvote_count
create or replace function public.update_vote_score()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.alerts 
    set 
      vote_score = vote_score + NEW.vote_type,
      upvote_count = upvote_count + (CASE WHEN NEW.vote_type = 1 THEN 1 ELSE 0 END)
    where id = NEW.alert_id;
    return NEW;
  elsif (TG_OP = 'UPDATE') then
    update public.alerts 
    set 
      vote_score = vote_score - OLD.vote_type + NEW.vote_type,
      upvote_count = upvote_count - (CASE WHEN OLD.vote_type = 1 THEN 1 ELSE 0 END) + (CASE WHEN NEW.vote_type = 1 THEN 1 ELSE 0 END)
    where id = NEW.alert_id;
    return NEW;
  elsif (TG_OP = 'DELETE') then
    update public.alerts 
    set 
      vote_score = vote_score - OLD.vote_type,
      upvote_count = upvote_count - (CASE WHEN OLD.vote_type = 1 THEN 1 ELSE 0 END)
    where id = OLD.alert_id;
    return OLD;
  end if;
  return null;
end;
$$ language plpgsql;

-- Trigger to maintain comment_count
create or replace function public.update_comment_count()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.alerts set comment_count = comment_count + 1 where id = NEW.alert_id;
    return NEW;
  elsif (TG_OP = 'DELETE') then
    update public.alerts set comment_count = comment_count - 1 where id = OLD.alert_id;
    return OLD;
  end if;
  return null;
end;
$$ language plpgsql;

drop trigger if exists on_comment_change on public.comments;
create trigger on_comment_change
after insert or delete on public.comments
for each row execute function public.update_comment_count();

drop trigger if exists on_vote_change on public.votes;
create trigger on_vote_change
after insert or update or delete on public.votes
for each row execute function public.update_vote_score();