import { z } from 'zod';

// Validated lazily on first use (not at import) so the build doesn't require
// credentials to be present. Never read process.env outside this file (§M).

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

let cachedPublicEnv: z.infer<typeof publicSchema> | null = null;

export function getPublicEnv(): z.infer<typeof publicSchema> {
  if (cachedPublicEnv) return cachedPublicEnv;
  // Reference each NEXT_PUBLIC_* key directly so Next can statically inline it.
  cachedPublicEnv = publicSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  return cachedPublicEnv;
}

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  ADMIN_EMAILS: z
    .string()
    .min(1)
    .transform((v) =>
      v
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean),
    ),
});

let cachedServerEnv: z.infer<typeof serverSchema> | null = null;

export function getServerEnv(): z.infer<typeof serverSchema> {
  if (cachedServerEnv) return cachedServerEnv;
  cachedServerEnv = serverSchema.parse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ADMIN_EMAILS: process.env.ADMIN_EMAILS,
  });
  return cachedServerEnv;
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getServerEnv().ADMIN_EMAILS.includes(email.toLowerCase());
}
