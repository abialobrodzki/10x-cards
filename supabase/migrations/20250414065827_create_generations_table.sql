-- migration: 20250414065827_create_generations_table.sql
-- description: Creates the generations table for tracking flashcard generation metrics
-- author: db-migration-tool

-- enable pgcrypto for uuid generation
create extension if not exists "pgcrypto";

-- table: generations
create table "public"."generations" (
  "id" bigint generated by default as identity primary key,
  "user_id" uuid not null references auth.users(id) on delete cascade,
  "model" varchar not null,
  "generated_count" integer not null,
  "accepted_unedited_count" integer not null,
  "accepted_edited_count" integer not null,
  "source_text_hash" varchar not null,
  "source_text_length" integer not null,
  "generation_duration" integer not null,
  "created_at" timestamptz not null default now(),
  "updated_at" timestamptz not null default now()
);

-- indexes for generations
create index if not exists "generations_user_id_idx" on "public"."generations" ("user_id");
create index if not exists "generations_created_at_idx" on "public"."generations" ("created_at");
create index if not exists "generations_source_text_hash_idx" on "public"."generations" ("source_text_hash");

-- create trigger function for updating the updated_at column
create or replace function "public"."handle_updated_at"() 
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- create trigger for updating the updated_at column on generations
create trigger "set_generations_updated_at"
before update on "public"."generations"
for each row
execute function "public"."handle_updated_at"();

-- enable row level security
alter table "public"."generations" enable row level security;

-- generations policies for authenticated users
create policy "users can view their own generations"
on "public"."generations"
for select
to authenticated
using (auth.uid() = user_id);

create policy "users can insert their own generations"
on "public"."generations"
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "users can update their own generations"
on "public"."generations"
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users can delete their own generations"
on "public"."generations"
for delete
to authenticated
using (auth.uid() = user_id); 