import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),

  // Supabase — optional; only required for arena game persistence
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // Arena behaviour
  ARENA_ENGINE: z.enum(['local', 'llm_openai']).default('local'),
  ARENA_MODE: z.enum(['ondemand', 'continuous']).default('ondemand'),

  // Required when ARENA_ENGINE=llm_openai or /api/scan/* is used; validated lazily in lib/openai.ts
  OPENAI_API_KEY: z.string().optional(),

  // Temp directory for repo extraction (defaults to os.tmpdir())
  SCAN_TMP_DIR: z.string().optional(),

  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),

  // Redis — only needed when ARENA_MODE=continuous
  REDIS_URL: z.string().url().optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment variables:\n', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

export const env = parsed.data
