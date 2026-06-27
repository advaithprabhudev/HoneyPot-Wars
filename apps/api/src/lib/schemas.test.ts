import { describe, it, expect } from 'vitest'
import { vulnFindingSchema, paramsSchema } from '@honeypot-wars/shared'

// SAFETY REGRESSION — CLAUDE.md §A.4
// This test block must never be deleted or modified to accept an invalid payload.
describe('paramsSchema — safety regression (CLAUDE.md §A.4)', () => {
  it('rejects a string value in params (injection attempt)', () => {
    // SAFETY REGRESSION — CLAUDE.md §A.4
    const result = vulnFindingSchema.safeParse({
      category: 'injection_vector',
      params: { inject: "' OR 1=1--" },
    })
    expect(result.success).toBe(false)
  })

  it('rejects unknown / extra fields via strict schema', () => {
    const result = paramsSchema.safeParse({ entropy: 0.5, unknownField: 0.9 })
    expect(result.success).toBe(false)
  })

  it('rejects param values outside [0, 1]', () => {
    const result = paramsSchema.safeParse({ entropy: 1.5 })
    expect(result.success).toBe(false)
  })

  it('accepts a fully valid VulnFinding', () => {
    const params: Record<string, number> = {
      entropy: 0.8, scopeExposure: 0.7, ageInDays: 0.6, rotationRisk: 0.9,
      inputSurface: 0.1, sinkDanger: 0.1, sanitiserPresence: 0.1, reachability: 0.1,
      exposureLevel: 0.1, bypassEase: 0.1, defaultness: 0.1, documentedRisk: 0.1,
      cvssScore: 0.1, transitivity: 0.1, exploitMaturity: 0.1, updateAvailable: 0.1,
    }
    const result = vulnFindingSchema.safeParse({
      category:        'hardcoded_secret',
      params,
      fingerprintHash: 'a'.repeat(64),
      location:        { file: 'src/config.ts', line: 42 },
      severity:        'critical',
    })
    expect(result.success).toBe(true)
  })
})
