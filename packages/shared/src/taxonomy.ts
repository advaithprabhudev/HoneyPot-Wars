export const VULN_CATEGORIES = [
  'hardcoded_secret',
  'injection_vector',
  'insecure_config',
  'vulnerable_dependency',
] as const
export type VulnCategory = (typeof VULN_CATEGORIES)[number]

export const AGENT_NAMES = ['secrets', 'injection', 'config', 'dependency'] as const
export type AgentName = (typeof AGENT_NAMES)[number]

export const PARAM_KEYS = [
  'entropy', 'scopeExposure', 'ageInDays', 'rotationRisk',
  'inputSurface', 'sinkDanger', 'sanitiserPresence', 'reachability',
  'exposureLevel', 'bypassEase', 'defaultness', 'documentedRisk',
  'cvssScore', 'transitivity', 'exploitMaturity', 'updateAvailable',
] as const
export type ParamKey = (typeof PARAM_KEYS)[number]

// Each agent owns exactly 4 params tied to its detection domain.
// No param appears in two agents' lists.
export const AGENT_PARAMS: Record<AgentName, readonly ParamKey[]> = {
  secrets:    ['entropy', 'scopeExposure', 'ageInDays', 'rotationRisk'],
  injection:  ['inputSurface', 'sinkDanger', 'sanitiserPresence', 'reachability'],
  config:     ['exposureLevel', 'bypassEase', 'defaultness', 'documentedRisk'],
  dependency: ['cvssScore', 'transitivity', 'exploitMaturity', 'updateAvailable'],
}

// Fusion weights — secrets carries the highest weight (strongest static-analysis signal).
// Weights must sum to 1.0.
export const FUSION_WEIGHTS: Record<AgentName, number> = {
  secrets:    0.35,
  injection:  0.25,
  config:     0.20,
  dependency: 0.20,
}

// Per-category expected high-risk values for local scanner param generation.
// Keys not listed default to 0.3 (neutral). All values are 0..1 (risk score).
export const CATEGORY_EMPHASIS: Record<VulnCategory, Partial<Record<ParamKey, number>>> = {
  hardcoded_secret: {
    entropy:       0.90,
    scopeExposure: 0.85,
    ageInDays:     0.75,
    rotationRisk:  0.90,
  },
  injection_vector: {
    inputSurface:      0.88,
    sinkDanger:        0.92,
    sanitiserPresence: 0.85,
    reachability:      0.80,
  },
  insecure_config: {
    exposureLevel:  0.82,
    bypassEase:     0.80,
    defaultness:    0.88,
    documentedRisk: 0.75,
  },
  vulnerable_dependency: {
    cvssScore:       0.85,
    transitivity:    0.80,
    exploitMaturity: 0.78,
    updateAvailable: 0.70,
  },
}

// fusedScore >= CATCH_THRESHOLD → caught; tuned so aggregate novel-attack win-rate ≈ 80–90%.
// Low-weight agents (config=0.20, dep=0.20) cap fusedScore around 0.37 so 0.44 would never
// catch those categories — 0.31 balances all four category catch rates to ≈ 88 % aggregate.
export const CATCH_THRESHOLD = 0.31

export const CATEGORY_LABELS: Record<VulnCategory, string> = {
  hardcoded_secret:      'Hardcoded Secret',
  injection_vector:      'Injection Vector',
  insecure_config:       'Insecure Config',
  vulnerable_dependency: 'Vulnerable Dependency',
}

export const AGENT_LABELS: Record<AgentName, string> = {
  secrets:    'Secrets Scanner',
  injection:  'Injection Detector',
  config:     'Config Auditor',
  dependency: 'Dependency Analyser',
}
