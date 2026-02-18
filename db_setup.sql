

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

-- Verifications Table for Alert Upvotes
create table if not exists public.verifications (
  id uuid default gen_random_uuid() primary key,
  alert_id uuid not null references public.alerts(id) on delete cascade,
  user_id uuid not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(alert_id, user_id)
);

-- Add verification_count to alerts if it doesn't exist
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name='alerts' and column_name='verification_count') then
    alter table public.alerts add column verification_count integer default 0;
  end if;
end $$;

-- Enable Row Level Security (RLS)
alter table public.alerts enable row level security;
alter table public.messages enable row level security;
alter table public.comments enable row level security;
alter table public.profiles enable row level security;
alter table public.verifications enable row level security;

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

drop policy if exists "Everyone can read verifications" on public.verifications;
drop policy if exists "Authenticated users can verify alerts" on public.verifications;
drop policy if exists "Users can remove their verification" on public.verifications;

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

-- Verifications Policies
create policy "Everyone can read verifications" 
on public.verifications for select 
using (true);

create policy "Authenticated users can verify alerts" 
on public.verifications for insert 
with check (auth.role() = 'authenticated');

create policy "Users can remove their verification" 
on public.verifications for delete 
using (auth.uid() = user_id);

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

  -- Verifications Realtime
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'verifications'
  ) then
    alter publication supabase_realtime add table public.verifications;
  end if;
end $$;

-- Trigger to maintain verification_count
create or replace function public.update_verification_count()
returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.alerts 
    set verification_count = verification_count + 1
    where id = NEW.alert_id;
    return NEW;
  elsif (TG_OP = 'DELETE') then
    update public.alerts 
    set verification_count = verification_count - 1
    where id = OLD.alert_id;
    return OLD;
  end if;
  return null;
end;
$$ language plpgsql;

drop trigger if exists on_verification_change on public.verifications;
create trigger on_verification_change
after insert or delete on public.verifications
for each row execute function public.update_verification_count();