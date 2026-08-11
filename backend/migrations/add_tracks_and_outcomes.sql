alter table cohorts add column if not exists program text;

create table if not exists cohort_tracks (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references cohorts(id) on delete cascade,
  name text not null,
  participant_count integer not null default 0,
  completion_pct numeric not null default 0,
  status text not null default 'in_progress',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_cohort_tracks_cohort_id on cohort_tracks (cohort_id);

create table if not exists cohort_outcomes (
  cohort_id uuid primary key references cohorts(id) on delete cascade,
  employment_rate numeric,
  avg_income_growth_multiplier numeric,
  post_avg_monthly_income numeric,
  african_companies_pct numeric,
  global_companies_pct numeric,
  updated_at timestamptz not null default now(),
  updated_by uuid references users(id)
);
