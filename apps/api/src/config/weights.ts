// Fusion weights and detection threshold are canonical in packages/shared/taxonomy.ts.
// Re-exported here for engine and orchestrator imports.
export { FUSION_WEIGHTS as WEIGHTS, CATCH_THRESHOLD as THRESHOLD } from '@honeypot-wars/shared'

// Cap on scanner retry attempts before the round is abandoned.
export const MAX_GENERATE_ATTEMPTS = 5
