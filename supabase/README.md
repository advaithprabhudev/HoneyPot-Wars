# Supabase setup

1. Create a new Supabase project.
2. In **SQL Editor**, run `schema.sql` (creates tables, RLS, the private
   `reports` storage bucket, and the `is_admin()` helper).
3. Run `seed.sql` to add your admin email to `admin_emails`. Make sure the same
   address is listed in the `ADMIN_EMAILS` env var.
4. **Project Settings → API**: copy the Project URL, the `anon` public key, and
   the `service_role` secret key into `.env.local` (see `.env.example`).
5. (Optional) **Authentication → Providers → Email**: for local testing, turn
   off "Confirm email" so signups are usable immediately.

The `reports` bucket is private. Clients never get public URLs — downloads are
served as short-lived signed URLs from `/api/reports/download` after the request
is authorised.
