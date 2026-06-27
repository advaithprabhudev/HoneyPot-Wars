-- Seed the admin allowlist. Keep this in sync with the ADMIN_EMAILS env var.
-- Re-run safely; conflicts are ignored.

insert into public.admin_emails (email) values
  ('prajjit2009@gmail.com')
on conflict (email) do nothing;
