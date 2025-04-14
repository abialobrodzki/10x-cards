-- migration: 20250414065829_create_error_logs_table.sql
-- description: Creates the generation_error_logs table for tracking AI generation errors
-- author: db-migration-tool

-- table: generation_error_logs
create table "public"."generation_error_logs" (
  "id" bigint generated by default as identity primary key,
  "user_id" uuid not null references auth.users(id) on delete cascade,
  "model" varchar not null,
  "source_text_hash" varchar not null,
  "source_text_length" integer not null,
  "error_code" varchar not null,
  "error_message" text not null,
  "created_at" timestamptz not null default now()
);

-- indexes for generation_error_logs
create index if not exists "generation_error_logs_user_id_idx" on "public"."generation_error_logs" ("user_id");
create index if not exists "generation_error_logs_created_at_idx" on "public"."generation_error_logs" ("created_at");
create index if not exists "generation_error_logs_error_code_idx" on "public"."generation_error_logs" ("error_code");

-- enable row level security
alter table "public"."generation_error_logs" enable row level security;

-- generation_error_logs policies for authenticated users
create policy "users can view their own generation error logs"
on "public"."generation_error_logs"
for select
to authenticated
using (auth.uid() = user_id);

create policy "users can insert their own generation error logs"
on "public"."generation_error_logs"
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "users can delete their own generation error logs"
on "public"."generation_error_logs"
for delete
to authenticated
using (auth.uid() = user_id);

-- no update policy for error logs as they should be immutable 