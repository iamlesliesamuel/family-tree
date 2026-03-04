-- Photo focal point support for tree card framing.

alter table public.person_photos
  add column if not exists focus_x integer not null default 50,
  add column if not exists focus_y integer not null default 50;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'person_photos_focus_x_range_check'
  ) then
    alter table public.person_photos
      add constraint person_photos_focus_x_range_check check (focus_x between 0 and 100);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'person_photos_focus_y_range_check'
  ) then
    alter table public.person_photos
      add constraint person_photos_focus_y_range_check check (focus_y between 0 and 100);
  end if;
end $$;
