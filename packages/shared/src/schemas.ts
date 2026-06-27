import { z } from 'zod'
import { VULN_CATEGORIES, PARAM_KEYS } from './taxonomy.js'

export const vulnCategorySchema = z.enum(VULN_CATEGORIES)
export const severitySchema = z.enum(['critical', 'high', 'medium', 'low'])

// Strict numeric-only param schema. .strict() is the §A safety gate:
// any extra field — including a string field — causes parse to throw.
// SAFETY REGRESSION — CLAUDE.md §A.4
export const paramsSchema = z
  .object(
    Object.fromEntries(PARAM_KEYS.map((k) => [k, z.number().min(0).max(1)])) as Record<
      (typeof PARAM_KEYS)[number],
      z.ZodNumber
    >,
  )
  .strict()

// VulnFinding schema — the §A safety boundary.
// params uses paramsSchema so only the 16 canonical PARAM_KEYS are accepted (no extra fields).
// SAFETY REGRESSION — CLAUDE.md §A.4: do not replace paramsSchema with z.record().
export const vulnFindingSchema = z
  .object({
    category:        vulnCategorySchema,
    params:          paramsSchema,
    fingerprintHash: z.string().length(64),
    location: z.object({
      file: z.string().max(300),
      line: z.number().int().min(0),
    }),
    severity: severitySchema,
  })
  .strict()

// Scan upload event payload (scan:upload socket event)
export const scanUploadSchema = z.object({
  fileName:    z.string().max(300),
  chunkIndex:  z.number().int().min(0),
  totalChunks: z.number().int().min(1),
  data:        z.string(),
})

// Printable ASCII + whitespace only — prevents log injection.
const safeString = (max: number): z.ZodString =>
  z.string().max(max).regex(/^[\x20-\x7E\t\n\r]*$/)

export const agentVerdictOutputSchema = z.object({
  confidence: z.number().min(0).max(1),
  signal:     safeString(160),
})

export const refereeOutputSchema = z.object({
  verdict: z.enum(['caught', 'slipped']),
  reason:  safeString(200),
})

export const arenaStartSchema = z.object({
  engine: z.enum(['local', 'llm_openai']),
  seed:   z.number().int().optional(),
})

export const roundResultSchema = z.object({
  id:         z.string(),
  seed:       z.number().int(),
  engine:     z.enum(['local', 'llm_openai']),
  finding:    vulnFindingSchema,
  verdicts:   z.array(
    agentVerdictOutputSchema.extend({ agent: z.string(), flagged: z.boolean() }),
  ),
  fusedScore: z.number().min(0).max(1),
  verdict:    z.enum(['caught', 'slipped']),
  isNovel:    z.boolean(),
  reason:     safeString(300),
  createdAt:  z.coerce.date(),
})

// Validate params against the full 16-key PARAM_KEYS set
export function validateFindingParams(params: unknown): Record<string, number> {
  return paramsSchema.parse(params) as Record<string, number>
}

export const attackPatternSchema = z.enum([
  'evasion',
  'gap_probe',
  'category_focus',
  'boundary_probe',
  'slip_streak',
])

export const detectorAlertSchema = z.object({
  pattern:      attackPatternSchema,
  confidence:   z.number().min(0).max(1),
  evidence:     safeString(160),
  windowRounds: z.number().int().min(1),
  slipRate:     z.number().min(0).max(1),
  createdAt:    z.coerce.date(),
})
