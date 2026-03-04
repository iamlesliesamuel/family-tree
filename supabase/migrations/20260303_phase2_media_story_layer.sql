-- Phase 2: Media + Story Layer
-- Safe/idempotent migration for Supabase Postgres + Storage

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.person_photos (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people(id) on delete cascade,
  storage_path text not null,
  caption text,
  uploaded_at timestamptz not null default now()
);

create index if not exists person_photos_person_id_idx
  on public.person_photos(person_id);

create table if not exists public.person_documents (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people(id) on delete cascade,
  title text not null,
  storage_path text not null,
  document_type text not null default 'other'
    check (document_type in (
      'funeral_program',
      'birth_certificate',
      'marriage_certificate',
      'obituary',
      'other'
    )),
  uploaded_at timestamptz not null default now()
);

create index if not exists person_documents_person_id_idx
  on public.person_documents(person_id);

create table if not exists public.person_notes (
  id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.people(id) on delete cascade unique,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text
);

create table if not exists public.person_tags (
  person_id uuid not null references public.people(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (person_id, tag_id)
);

create index if not exists person_tags_person_id_idx
  on public.person_tags(person_id);

create index if not exists person_tags_tag_id_idx
  on public.person_tags(tag_id);

create table if not exists public.relationship_notes (
  id uuid primary key default gen_random_uuid(),
  relationship_id uuid not null references public.relationships(id) on delete cascade unique,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at trigger utility
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_person_notes_updated_at on public.person_notes;
create trigger set_person_notes_updated_at
before update on public.person_notes
for each row execute function public.set_updated_at();

drop trigger if exists set_relationship_notes_updated_at on public.relationship_notes;
create trigger set_relationship_notes_updated_at
before update on public.relationship_notes
for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS policies (public read, authenticated writes)
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.person_photos enable row level security;
alter table public.person_documents enable row level security;
alter table public.person_notes enable row level security;
alter table public.tags enable row level security;
alter table public.person_tags enable row level security;
alter table public.relationship_notes enable row level security;

-- person_photos
create policy if not exists person_photos_select_all
  on public.person_photos for select
  using (true);

create policy if not exists person_photos_write_auth
  on public.person_photos for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- person_documents
create policy if not exists person_documents_select_all
  on public.person_documents for select
  using (true);

create policy if not exists person_documents_write_auth
  on public.person_documents for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- person_notes
create policy if not exists person_notes_select_all
  on public.person_notes for select
  using (true);

create policy if not exists person_notes_write_auth
  on public.person_notes for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- tags
create policy if not exists tags_select_all
  on public.tags for select
  using (true);

create policy if not exists tags_write_auth
  on public.tags for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- person_tags
create policy if not exists person_tags_select_all
  on public.person_tags for select
  using (true);

create policy if not exists person_tags_write_auth
  on public.person_tags for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- relationship_notes
create policy if not exists relationship_notes_select_all
  on public.relationship_notes for select
  using (true);

create policy if not exists relationship_notes_write_auth
  on public.relationship_notes for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────────────────────
-- Storage buckets + policies
-- ─────────────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('person-photos', 'person-photos', true)
on conflict (id) do update set public = excluded.public;

insert into storage.buckets (id, name, public)
values ('family-documents', 'family-documents', false)
on conflict (id) do update set public = excluded.public;

-- person-photos policies
create policy if not exists person_photos_bucket_public_read
  on storage.objects for select
  using (bucket_id = 'person-photos');

create policy if not exists person_photos_bucket_auth_insert
  on storage.objects for insert
  with check (bucket_id = 'person-photos' and auth.role() = 'authenticated');

create policy if not exists person_photos_bucket_auth_update
  on storage.objects for update
  using (bucket_id = 'person-photos' and auth.role() = 'authenticated')
  with check (bucket_id = 'person-photos' and auth.role() = 'authenticated');

create policy if not exists person_photos_bucket_auth_delete
  on storage.objects for delete
  using (bucket_id = 'person-photos' and auth.role() = 'authenticated');

-- family-documents policies (private bucket)
create policy if not exists family_documents_bucket_auth_select
  on storage.objects for select
  using (bucket_id = 'family-documents' and auth.role() = 'authenticated');

create policy if not exists family_documents_bucket_auth_insert
  on storage.objects for insert
  with check (bucket_id = 'family-documents' and auth.role() = 'authenticated');

create policy if not exists family_documents_bucket_auth_update
  on storage.objects for update
  using (bucket_id = 'family-documents' and auth.role() = 'authenticated')
  with check (bucket_id = 'family-documents' and auth.role() = 'authenticated');

create policy if not exists family_documents_bucket_auth_delete
  on storage.objects for delete
  using (bucket_id = 'family-documents' and auth.role() = 'authenticated');
