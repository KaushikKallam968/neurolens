-- NeuroLens v2 Schema Migration
-- Creates campaigns, videos, analyses_v2, share_tokens, benchmarks tables
-- with RLS policies for user isolation and share token read access

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- CAMPAIGNS
-- ============================================
create table if not exists campaigns (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  content_type text not null default 'custom',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Index for user lookups
create index idx_campaigns_user_id on campaigns(user_id);

-- RLS: users see only their own campaigns
alter table campaigns enable row level security;

create policy "Users can view own campaigns"
  on campaigns for select
  using (auth.uid() = user_id);

create policy "Users can create own campaigns"
  on campaigns for insert
  with check (auth.uid() = user_id);

create policy "Users can update own campaigns"
  on campaigns for update
  using (auth.uid() = user_id);

create policy "Users can delete own campaigns"
  on campaigns for delete
  using (auth.uid() = user_id);

-- ============================================
-- VIDEOS
-- ============================================
create table if not exists videos (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid references campaigns(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  filename text not null,
  storage_path text not null,
  content_type text not null default 'custom',
  file_size bigint,
  duration_seconds float,
  width integer,
  height integer,
  status text not null default 'uploaded',  -- uploaded | processing | complete | error
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_videos_campaign_id on videos(campaign_id);
create index idx_videos_user_id on videos(user_id);

alter table videos enable row level security;

create policy "Users can view own videos"
  on videos for select
  using (auth.uid() = user_id);

create policy "Users can create own videos"
  on videos for insert
  with check (auth.uid() = user_id);

create policy "Users can update own videos"
  on videos for update
  using (auth.uid() = user_id);

create policy "Users can delete own videos"
  on videos for delete
  using (auth.uid() = user_id);

-- ============================================
-- ANALYSES (v2)
-- ============================================
create table if not exists analyses_v2 (
  id uuid primary key default uuid_generate_v4(),
  video_id uuid references videos(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  schema_version integer not null default 2,
  status text not null default 'pending',  -- pending | processing | complete | error
  content_type text not null default 'custom',
  neural_score integer,
  percentile integer,
  metrics jsonb,
  timeline jsonb,
  sensory_timeline jsonb,
  cognitive_load jsonb,
  focus_score jsonb,
  narrative_arc jsonb,
  av_sync_score jsonb,
  key_moments jsonb,
  peaks jsonb,
  suggestions jsonb,
  video_meta jsonb,
  replicate_prediction_id text,
  error_message text,
  processing_started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index idx_analyses_v2_video_id on analyses_v2(video_id);
create index idx_analyses_v2_user_id on analyses_v2(user_id);
create index idx_analyses_v2_status on analyses_v2(status);

alter table analyses_v2 enable row level security;

create policy "Users can view own analyses"
  on analyses_v2 for select
  using (auth.uid() = user_id);

create policy "Users can create own analyses"
  on analyses_v2 for insert
  with check (auth.uid() = user_id);

create policy "Users can update own analyses"
  on analyses_v2 for update
  using (auth.uid() = user_id);

-- ============================================
-- SHARE TOKENS
-- ============================================
create table if not exists share_tokens (
  id uuid primary key default uuid_generate_v4(),
  analysis_id uuid references analyses_v2(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  visibility text not null default 'full',  -- full | scores_only | specific_metrics
  visible_metrics text[],  -- for 'specific_metrics' visibility
  expires_at timestamptz,
  created_at timestamptz default now() not null
);

create index idx_share_tokens_token on share_tokens(token);

alter table share_tokens enable row level security;

-- Owners can manage their tokens
create policy "Users can manage own share tokens"
  on share_tokens for all
  using (auth.uid() = user_id);

-- Anyone with the token can read the associated analysis (via Edge Function, not direct RLS)
-- The Edge Function uses service_role to fetch analysis data for valid tokens

-- ============================================
-- BENCHMARKS
-- ============================================
create table if not exists benchmarks (
  id uuid primary key default uuid_generate_v4(),
  content_type text not null,
  metric_name text not null,
  metric_value float not null,
  neural_score integer,
  analysis_id uuid references analyses_v2(id) on delete set null,
  created_at timestamptz default now() not null
);

create index idx_benchmarks_content_type on benchmarks(content_type);
create index idx_benchmarks_metric on benchmarks(content_type, metric_name);

-- Benchmarks are write-only by service role (Edge Functions)
-- and readable by all authenticated users for percentile computation
alter table benchmarks enable row level security;

create policy "Authenticated users can read benchmarks"
  on benchmarks for select
  using (auth.role() = 'authenticated');

-- ============================================
-- STORAGE POLICIES
-- ============================================
-- Video uploads go to 'videos' bucket
-- insert into storage.buckets (id, name, public) values ('videos', 'videos', false);

-- Users can upload to their own folder (user_id/filename)
-- create policy "Users can upload own videos"
--   on storage.objects for insert
--   with check (bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1]);

-- Users can read own videos
-- create policy "Users can read own videos"
--   on storage.objects for select
--   using (bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger campaigns_updated_at before update on campaigns
  for each row execute function update_updated_at_column();

create trigger videos_updated_at before update on videos
  for each row execute function update_updated_at_column();

create trigger analyses_v2_updated_at before update on analyses_v2
  for each row execute function update_updated_at_column();
