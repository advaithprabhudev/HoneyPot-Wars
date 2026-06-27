import { createHash } from 'crypto'
import { PARAM_KEYS } from '@honeypot-wars/shared'

// Canonical serialisation: all 16 PARAM_KEYS in taxonomy order, values at 6dp.
// Locked format — changing precision or sort order changes all hashes.
export function fingerprintHash(params: Record<string, number>): string {
  const parts = PARAM_KEYS.map((k) => `${k}=${(params[k] ?? 0).toFixed(6)}`)
  return createHash('sha256').update(parts.join('&')).digest('hex')
}
