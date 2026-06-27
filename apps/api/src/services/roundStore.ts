import type { LeaderboardMetric, RoundResult } from '@honeypot/shared';
import { isMongoConnected } from '../lib/db.js';
import { RoundModel } from '../models/Round.js';
import { logger } from '../lib/logger.js';

/**
 * In-memory ring buffer is the source of truth for reads so the arcade demo runs
 * identically with or without MongoDB. When Mongo is connected we ALSO write
 * through for durability. We track paramHashes to compute novelty.
 */
const MAX_ROUNDS = 2000;
const rounds: RoundResult[] = [];
const seenHashes = new Set<string>();

export function isHashSeen(hash: string): boolean {
  return seenHashes.has(hash);
}

export async function recordRound(round: RoundResult): Promise<void> {
  rounds.push(round);
  if (rounds.length > MAX_ROUNDS) rounds.shift();
  seenHashes.add(round.attack.paramHash);

  if (isMongoConnected()) {
    try {
      await RoundModel.create({
        seed: round.seed,
        engine: round.engine,
        attack: {
          archetype: round.attack.archetype,
          params: round.attack.params,
          paramHash: round.attack.paramHash, // log only the hash (CLAUDE.md §13)
        },
        verdicts: round.verdicts,
        fusedScore: round.fusedScore,
        verdict: round.verdict,
        isNovel: round.isNovel,
        reason: round.reason,
      });
    } catch (err) {
      logger.warn({ err: (err as Error).message }, 'failed to persist round to Mongo');
    }
  }
}

export function listRounds(limit = 50, novelOnly = false): RoundResult[] {
  const source = novelOnly ? rounds.filter((r) => r.isNovel) : rounds;
  return source.slice(-limit).reverse();
}

/** Detection rate is computed over NOVEL attacks only (CLAUDE.md §5/§13). */
export function computeLeaderboard(windowDays = 7): LeaderboardMetric {
  const since = Date.now() - windowDays * 24 * 60 * 60 * 1000;
  const inWindow = rounds.filter((r) => Date.parse(r.createdAt) >= since);
  const novel = inWindow.filter((r) => r.isNovel);
  const caught = novel.filter((r) => r.verdict === 'caught').length;
  const novelSlips = novel.filter((r) => r.verdict === 'slipped').length;
  return {
    windowDays,
    detectionRate: novel.length === 0 ? 0 : caught / novel.length,
    totalRounds: inWindow.length,
    novelSlips,
    updatedAt: new Date().toISOString(),
  };
}

export function liveMetric(): { detectionRate: number; totalRounds: number; novelSlips: number } {
  const m = computeLeaderboard(3650);
  return { detectionRate: m.detectionRate, totalRounds: m.totalRounds, novelSlips: m.novelSlips };
}

export function resetStore(): void {
  rounds.length = 0;
  seenHashes.clear();
}
