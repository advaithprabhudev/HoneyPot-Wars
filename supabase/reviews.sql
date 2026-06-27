-- v2: reviews table — admin's written verdict on a specific client check.
-- Run this once in the Supabase SQL Editor (project nyncjrpydudvthmjbmam).

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
