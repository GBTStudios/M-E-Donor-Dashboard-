alter table users add column if not exists company text;

alter table user_settings add column if not exists quarterly_report_ready boolean not null default false;
alter table user_settings add column if not exists new_cohort_milestones boolean not null default false;
alter table user_settings add column if not exists answer_corrections boolean not null default false;
alter table user_settings add column if not exists language text not null default 'English';
alter table user_settings add column if not exists timezone text not null default 'UTC';
