-- Allow selecting one designated profile photo per person.

alter table public.person_photos
  add column if not exists is_profile boolean not null default false;

create unique index if not exists person_photos_one_profile_per_person_idx
  on public.person_photos(person_id)
  where is_profile = true;
