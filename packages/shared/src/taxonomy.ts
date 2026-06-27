/**
 * The taxonomy is the single source of truth for the abstract attack space.
 *
 * SAFETY (CLAUDE.md §1): an attack is ONLY ever a vector of abstract knobs in
 * [0, 1] over a fixed parameter space, plus an archetype label. There is no free
 * text, no scam copy, no deployable artifact anywhere in this file or its schema.
 */

export const ARCHETYPES = [
  'advance_fee',
  'triangulation',
  'account_takeover',
  'refund_fraud',
] as const;

export type Archetype = (typeof ARCHETYPES)[number];

export const AGENT_NAMES = ['text', 'listing_image', 'price_anomaly', 'seller_graph'] as const;

export type AgentName = (typeof AGENT_NAMES)[number];

/**
 * The fixed parameter space. Every value is an abstract risk knob in [0, 1].
 * Keys are stable; the novelty hash is computed over these sorted keys.
 */
export const PARAM_KEYS = [
  'urgency',
  'offPlatformPush',
  'claimVagueness',
  'imageReuse',
  'stockPhotoLikeness',
  'priceDeviation',
  'velocityAnomaly',
  'sellerAgeInverse',
  'ringConnectivity',
  'payoutChange',
] as const;

export type ParamKey = (typeof PARAM_KEYS)[number];

/** Which defender agent draws signal from which parameters. */
export const AGENT_PARAMS: Record<AgentName, readonly ParamKey[]> = {
  text: ['urgency', 'offPlatformPush', 'claimVagueness'],
  listing_image: ['imageReuse', 'stockPhotoLikeness'],
  price_anomaly: ['priceDeviation', 'velocityAnomaly'],
  seller_graph: ['sellerAgeInverse', 'ringConnectivity', 'payoutChange'],
};

/**
 * Fusion weights for combining the four agent confidences into one score.
 * seller_graph carries the most weight: relational ring-detection is the
 * strongest real-world signal (CLAUDE.md §6). Weights sum to 1.
 */
export const FUSION_WEIGHTS: Record<AgentName, number> = {
  seller_graph: 0.34,
  price_anomaly: 0.26,
  text: 0.22,
  listing_image: 0.18,
};

/**
 * Per-archetype emphasis: the mean of each knob the generator samples around.
 * This shapes what a "typical" attack of each archetype looks like, while still
 * leaving room for the generator to produce novel combinations.
 */
export const ARCHETYPE_EMPHASIS: Record<Archetype, Partial<Record<ParamKey, number>>> = {
  advance_fee: {
    urgency: 0.8,
    offPlatformPush: 0.85,
    claimVagueness: 0.6,
    priceDeviation: 0.7,
    sellerAgeInverse: 0.55,
  },
  triangulation: {
    priceDeviation: 0.75,
    velocityAnomaly: 0.7,
    ringConnectivity: 0.8,
    sellerAgeInverse: 0.5,
    imageReuse: 0.65,
  },
  account_takeover: {
    payoutChange: 0.85,
    velocityAnomaly: 0.6,
    sellerAgeInverse: 0.4,
    ringConnectivity: 0.5,
    offPlatformPush: 0.45,
  },
  refund_fraud: {
    claimVagueness: 0.8,
    urgency: 0.55,
    velocityAnomaly: 0.5,
    payoutChange: 0.4,
    stockPhotoLikeness: 0.45,
  },
};

/** The threshold the Referee uses to map fusedScore to a verdict. */
export const CATCH_THRESHOLD = 0.44;

/** Human-readable archetype labels for the UI. */
export const ARCHETYPE_LABELS: Record<Archetype, string> = {
  advance_fee: 'ADVANCE FEE',
  triangulation: 'TRIANGULATION',
  account_takeover: 'ACCOUNT TAKEOVER',
  refund_fraud: 'REFUND FRAUD',
};

export const AGENT_LABELS: Record<AgentName, string> = {
  text: 'TEXT',
  listing_image: 'LISTING IMG',
  price_anomaly: 'PRICE',
  seller_graph: 'SELLER GRAPH',
};
