# Honeypot Wars

Security-assessment platform front end: a retro-arcade marketing landing page,
client accounts, a session-request → approval flow, and an admin panel for
uploading client reports. Built per `CLAUDE.md` (the AI scan engine itself is
intentionally out of scope here).

## Stack

Next.js 14 (App Router) · TypeScript (strict) · Supabase (Auth + Postgres + Storage)
with Row-Level Security · Zod.

## Setup

1. **Install:** `npm install`
2. **Supabase:** create a project, then in the SQL editor run `supabase/schema.sql`
   followed by `supabase/seed.sql`. See `supabase/README.md` for details. This
   creates the tables, RLS policies, the `is_admin()` helper, and the private
   `reports` storage bucket.
3. **Env:** copy `.env.example` → `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Settings → API)
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only secret; never exposed to the client)
   - `ADMIN_EMAILS` (comma-separated; must match the address seeded into `admin_emails`)
4. **Run:** `npm run dev` → http://localhost:3000

> `.env.local` currently holds placeholders so the project builds. Replace them
> with real Supabase credentials before auth/dashboard/admin features will work.

## Flow

- **Client** signs up → requests a session (repo/URL + consent) → sees status on
  their dashboard.
- **Admin** (email in `ADMIN_EMAILS`) opens `/admin`, approves/rejects requests
  (approval activates the account), opens a client, and uploads report PDFs.
- **Client** downloads their reports via short-lived signed URLs — files are
  never public.

## Security notes

- Admin actions run server-side only, behind an email-allowlist check in both
  middleware and the API routes, using the service-role key.
- RLS restricts every client to their own profile, requests, and reports.
- Clients cannot self-activate (a DB trigger blocks `account_status` changes by
  non-admins).
- The private `reports` bucket is readable only by the owning client or an admin.

## Scripts

`npm run dev` · `npm run build` · `npm run start` · `npm run lint`
