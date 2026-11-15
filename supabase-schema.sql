-- Run this script in Supabase SQL Editor for project lewbqologrsbwxahqjpq.
-- Create the administrator under Authentication > Users, then assign the admin app_metadata role.
-- Example (replace the email with that Auth user's email):
-- update auth.users
-- set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
-- where email = 'admin@example.com';
create table if not exists public.site_settings (
  id text primary key check (id = 'main'),
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name varchar(80) not null,
  location varchar(80) not null,
  comment varchar(600) not null,
  language text not null default 'fr' check (language in ('ar','fr','en')),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;
alter table public.testimonials enable row level security;

drop policy if exists "Public reads site settings" on public.site_settings;
create policy "Public reads site settings" on public.site_settings
  for select to anon, authenticated using (true);

drop policy if exists "Admins insert site settings" on public.site_settings;
create policy "Admins insert site settings" on public.site_settings
  for insert to authenticated with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins update site settings" on public.site_settings;
create policy "Admins update site settings" on public.site_settings
  for update to authenticated using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Public reads approved testimonials" on public.testimonials;
create policy "Public reads approved testimonials" on public.testimonials
  for select to anon, authenticated using (status = 'approved');

drop policy if exists "Public submits pending testimonials" on public.testimonials;
create policy "Public submits pending testimonials" on public.testimonials
  for insert to anon, authenticated with check (status = 'pending');

drop policy if exists "Admins read all testimonials" on public.testimonials;
create policy "Admins read all testimonials" on public.testimonials
  for select to authenticated using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins moderate testimonials" on public.testimonials;
create policy "Admins moderate testimonials" on public.testimonials
  for update to authenticated using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists "Admins delete testimonials" on public.testimonials;
create policy "Admins delete testimonials" on public.testimonials
  for delete to authenticated using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

grant select on public.site_settings to anon, authenticated;
grant insert, update on public.site_settings to authenticated;
grant select, insert on public.testimonials to anon, authenticated;
grant update, delete on public.testimonials to authenticated;
