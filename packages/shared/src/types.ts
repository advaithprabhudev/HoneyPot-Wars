import type { AgentName, Archetype } from './taxonomy.js';

export type Engine = 'local' | 'llm';
export type Verdict = 'caught' | 'slipped';

export interface Attack {
  archetype: Archetype;
  /** Abstract knobs in [0, 1] keyed by ParamKey. Never free text. */
  params: Record<string, number>;
  /** sha256 of the sorted params; the novelty key. */
  paramHash: string;
}

export interface AgentVerdict {
  agent: AgentName;
  confidence: number; // 0..1
  flagged: boolean;
  signal: string; // one-line explanation, no scam content
}

export interface RoundResult {
  id: string;
  seed: number;
  engine: Engine;
  attack: Attack;
  verdicts: AgentVerdict[]; // exactly 4
  fusedScore: number; // 0..1
  verdict: Verdict; // REFEREE decides
  isNovel: boolean;
  reason: string;
  createdAt: string; // ISO 8601
}

export interface FeedLine {
  id: string;
  roundId: string;
  archetype: Archetype;
  verdict: Verdict;
  isNovel: boolean;
  fusedScore: number;
  topAgent: AgentName;
  reason: string;
  createdAt: string;
}

export interface LeaderboardMetric {
  windowDays: number;
  detectionRate: number; // caught / total over NOVEL attacks only
  totalRounds: number;
  novelSlips: number;
  updatedAt: string;
}

export interface ArenaMetric {
  detectionRate: number;
  totalRounds: number;
  novelSlips: number;
}

export interface TaxonomyInfo {
  archetypes: readonly Archetype[];
  paramKeys: readonly string[];
  agents: readonly AgentName[];
}
