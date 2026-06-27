import { z } from 'zod';

/**
 * The ONLY place process.env is read. Validated at boot; fail fast on a missing
 * required var (CLAUDE.md §11). Secrets live here, never in client code or logs.
 */
const schema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    MONGODB_URI: z.string().default('mongodb://localhost:27017/honeypot_wars'),
    REDIS_URL: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    ARENA_ENGINE: z.enum(['local', 'llm']).default('local'),
    ARENA_MODE: z.enum(['ondemand', 'continuous']).default('ondemand'),
    CORS_ORIGIN: z.string().default('http://localhost:5173'),
    LOG_LEVEL: z.string().default('info'),
  })
  .superRefine((env, ctx) => {
    if (env.ARENA_ENGINE === 'llm' && !env.ANTHROPIC_API_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'ANTHROPIC_API_KEY is required when ARENA_ENGINE=llm',
        path: ['ANTHROPIC_API_KEY'],
      });
    }
  });

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
