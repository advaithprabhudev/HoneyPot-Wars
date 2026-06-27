-- Honeypot Wars — database schema, RLS, and storage policies.
-- Run this in the Supabase SQL editor (or via the CLI) on a fresh project.
-- Idempotent where practical so it can be re-run during setup.

-- ============================================================
-- Extensions
-- ============================================================
create extension if not exists "pgcrypto";

-- ============================================================
-- Admin allowlist + helper
-- ============================================================
create table if not exists public.admin_emails (
  email text primary key
);
alter table public.admin_emails enable row level security;
-- No policies => only the service role / SECURITY DEFINER functions can read it.

-- True when the current JWT's email is in the admin allowlist.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_emails
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ============================================================
-- profiles (1:1 with auth.users)
-- ============================================================
create table if not exists public.profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  email             text not null,
  company_name      text,
  registered_domain text,
  account_status    text not null default 'pending'
                      check (account_status in ('pending','active','suspended')),
  created_at        timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- Auto-create a profile row on signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, company_name, registered_domain)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'company_name', ''),
    nullif(new.raw_user_meta_data ->> 'registered_domain', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Prevent clients from self-activating: only admins may change account_status.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.account_status := old.account_status;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_update on public.profiles;
create trigger profiles_guard_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin());

-- ============================================================
-- session_requests (consultation / scan requests)
-- ============================================================
create table if not exists public.session_requests (
  id              uuid primary key default gen_random_uuid(),
  account_id      uuid not null references public.profiles(id) on delete cascade,
  repo_url        text not null,
  deployment_url  text,
  notes           text,
  consent_signed  boolean not null default false,
  status          text not null default 'pending'
                    check (status in ('pending','approved','rejected')),
  requested_at    timestamptz not null default now(),
  reviewed_at     timestamptz,
  reviewed_by     uuid references auth.users(id)
);
alter table public.session_requests enable row level security;
create index if not exists session_requests_account_idx on public.session_requests(account_id);
create index if not exists session_requests_status_idx on public.session_requests(status);

drop policy if exists "requests_select_own_or_admin" on public.session_requests;
create policy "requests_select_own_or_admin" on public.session_requests
  for select using (account_id = auth.uid() or public.is_admin());

-- Clients may submit their own requests with a signed consent; admins too.
drop policy if exists "requests_insert_own" on public.session_requests;
create policy "requests_insert_own" on public.session_requests
  for insert with check (
    (account_id = auth.uid() and consent_signed = true) or public.is_admin()
  );

drop policy if exists "requests_update_admin" on public.session_requests;
create policy "requests_update_admin" on public.session_requests
  for update using (public.is_admin());

-- ============================================================
-- reports (uploaded files, metadata only — file lives in Storage)
-- ============================================================
create table if not exists public.reports (
  id                  uuid primary key default gen_random_uuid(),
  account_id          uuid not null references public.profiles(id) on delete cascade,
  session_request_id  uuid references public.session_requests(id) on delete set null,
  title               text not null,
  report_type         text not null default 'other'
                        check (report_type in ('technical','summary','other')),
  storage_path        text not null,
  file_name           text not null,
  uploaded_by         uuid references auth.users(id),
  created_at          timestamptz not null default now()
);
alter table public.reports enable row level security;
create index if not exists reports_account_idx on public.reports(account_id);

drop policy if exists "reports_select_own_or_admin" on public.reports;
create policy "reports_select_own_or_admin" on public.reports
  for select using (account_id = auth.uid() or public.is_admin());

drop policy if exists "reports_write_admin" on public.reports;
create policy "reports_write_admin" on public.reports
  for all using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- Storage: private "reports" bucket + policies
-- ============================================================
insert into storage.buckets (id, name, public)
values ('reports', 'reports', false)
on conflict (id) do nothing;

-- Object paths are "{account_id}/{filename}". Owner = first path segment.
drop policy if exists "reports_obj_read_own_or_admin" on storage.objects;
create policy "reports_obj_read_own_or_admin" on storage.objects
  for select using (
    bucket_id = 'reports'
    and (public.is_admin() or (storage.foldername(name))[1] = auth.uid()::text)
  );

drop policy if exists "reports_obj_insert_admin" on storage.objects;
create policy "reports_obj_insert_admin" on storage.objects
  for insert with check (bucket_id = 'reports' and public.is_admin());

drop policy if exists "reports_obj_update_admin" on storage.objects;
create policy "reports_obj_update_admin" on storage.objects
  for update using (bucket_id = 'reports' and public.is_admin());

drop policy if exists "reports_obj_delete_admin" on storage.objects;
create policy "reports_obj_delete_admin" on storage.objects
  for delete using (bucket_id = 'reports' and public.is_admin());

-- ============================================================
-- reviews (admin's written verdict on a specific client check)
-- ============================================================
create table if not exists public.reviews (
  id                  uuid primary key default gen_random_uuid(),
  account_id          uuid not null references public.profiles(id) on delete cascade,
  session_request_id  uuid references public.session_requests(id) on delete cascade,
  body                text not null,
  verdict             text,
  created_by          uuid references auth.users(id),
  created_at          timestamptz not null default now()
);
alter table public.reviews enable row level security;
create index if not exists reviews_account_idx on public.reviews(account_id);
create index if not exists reviews_request_idx on public.reviews(session_request_id);

drop policy if exists "reviews_select_own_or_admin" on public.reviews;
create policy "reviews_select_own_or_admin" on public.reviews
  for select using (account_id = auth.uid() or public.is_admin());

drop policy if exists "reviews_write_admin" on public.reviews;
create policy "reviews_write_admin" on public.reviews
  for all using (public.is_admin()) with check (public.is_admin());
