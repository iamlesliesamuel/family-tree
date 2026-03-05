-- Phase 3: archive safety + edit history + activity feed

create extension if not exists pgcrypto;

-- Soft archive fields on core genealogy tables
alter table public.people
  add column if not exists archived_at timestamptz null,
  add column if not exists archived_reason text null;

alter table public.relationships
  add column if not exists archived_at timestamptz null;

alter table public.parent_child
  add column if not exists archived_at timestamptz null;

-- Optional soft archive for media/documents to avoid permanent deletes in UI
alter table public.person_photos
  add column if not exists archived_at timestamptz null;

alter table public.person_documents
  add column if not exists archived_at timestamptz null;

-- Edit history
create table if not exists public.edit_history (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  person_id uuid null,
  action text not null,
  field_name text null,
  old_value text null,
  new_value text null,
  meta jsonb null,
  created_at timestamptz not null default now(),
  edited_by text null
);

create index if not exists edit_history_created_at_idx
  on public.edit_history(created_at desc);

create index if not exists edit_history_entity_idx
  on public.edit_history(entity_type, entity_id);

create index if not exists edit_history_person_idx
  on public.edit_history(person_id);

create index if not exists people_archived_at_idx
  on public.people(archived_at);

create index if not exists relationships_archived_at_idx
  on public.relationships(archived_at);

create index if not exists parent_child_archived_at_idx
  on public.parent_child(archived_at);

create index if not exists person_photos_archived_at_idx
  on public.person_photos(archived_at);

create index if not exists person_documents_archived_at_idx
  on public.person_documents(archived_at);

alter table public.edit_history enable row level security;

drop policy if exists edit_history_select_all on public.edit_history;
create policy edit_history_select_all
  on public.edit_history for select
  using (true);

drop policy if exists edit_history_write_auth on public.edit_history;
create policy edit_history_write_auth
  on public.edit_history for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- Read helper for recent activity (friendly summary)
create or replace function public.get_recent_activity(limit_count integer default 50)
returns table (
  id uuid,
  entity_type text,
  entity_id uuid,
  person_id uuid,
  action text,
  field_name text,
  old_value text,
  new_value text,
  meta jsonb,
  created_at timestamptz,
  edited_by text,
  description text
)
language sql
stable
as $$
  select
    eh.id,
    eh.entity_type,
    eh.entity_id,
    eh.person_id,
    eh.action,
    eh.field_name,
    eh.old_value,
    eh.new_value,
    eh.meta,
    eh.created_at,
    eh.edited_by,
    case
      when eh.action = 'upload' and eh.entity_type = 'person_photos' then 'Photo added'
      when eh.action = 'upload' and eh.entity_type = 'person_documents' then 'Document added'
      when eh.action = 'archive' then 'Archived record'
      when eh.action = 'restore' then 'Restored record'
      when eh.action = 'create' then 'Created record'
      when eh.action = 'update' and eh.field_name is not null then 'Updated ' || eh.field_name
      when eh.action = 'update' then 'Updated record'
      else initcap(eh.action)
    end as description
  from public.edit_history eh
  order by eh.created_at desc
  limit greatest(1, least(coalesce(limit_count, 50), 200));
$$;
