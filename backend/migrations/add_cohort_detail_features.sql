-- Reports Center
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  cohort_id uuid references cohorts(id) on delete set null,
  report_date date not null,
  file_url text not null,
  file_type text not null,
  file_size integer,
  uploaded_by uuid references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_reports_report_date on reports (report_date desc);
create index if not exists idx_reports_cohort_id on reports (cohort_id);

-- Cohort date range
alter table cohorts add column if not exists start_date date;
alter table cohorts add column if not exists end_date date;

-- Participant graduation tracking
alter table participants add column if not exists graduation_status text
  check (graduation_status in ('enrolled', 'graduated', 'dropped_out'))
  default 'enrolled';

-- Track which cohort an import batch was assigned to
alter table participant_imports add column if not exists cohort_id uuid references cohorts(id);

-- Link stories and insights to a cohort (nullable - existing global ones unaffected)
alter table stories add column if not exists cohort_id uuid references cohorts(id) on delete set null;
alter table dashboard_insights add column if not exists cohort_id uuid references cohorts(id) on delete set null;
