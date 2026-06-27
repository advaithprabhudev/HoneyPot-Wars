import { describe, expect, it } from 'vitest';
import { ARCHETYPES } from '@honeypot/shared';
import { runRound } from './orchestrator.js';

const neverSeen = () => false;

describe('orchestrator (local engine)', () => {
  it('is deterministic: same seed yields the same RoundResult', async () => {
    const a = await runRound({ engine: 'local', seed: 42, isHashSeen: neverSeen });
    const b = await runRound({ engine: 'local', seed: 42, isHashSeen: neverSeen });
    expect(b.attack.paramHash).toBe(a.attack.paramHash);
    expect(b.fusedScore).toBe(a.fusedScore);
    expect(b.verdict).toBe(a.verdict);
    expect(b.verdicts).toEqual(a.verdicts);
  });

  it('produces exactly four agent verdicts', async () => {
    const r = await runRound({ engine: 'local', seed: 7, isHashSeen: neverSeen });
    expect(r.verdicts).toHaveLength(4);
  });

  it('covers all four archetypes across seeds', async () => {
    const seen = new Set<string>();
    for (let s = 0; s < 400 && seen.size < ARCHETYPES.length; s += 1) {
      const r = await runRound({ engine: 'local', seed: s, isHashSeen: neverSeen });
      seen.add(r.attack.archetype);
    }
    expect(seen.size).toBe(ARCHETYPES.length);
  });

  it('novelty: a previously-seen paramHash is not novel', async () => {
    const first = await runRound({ engine: 'local', seed: 99, isHashSeen: neverSeen });
    expect(first.isNovel).toBe(true);
    const repeat = await runRound({
      engine: 'local',
      seed: 99,
      isHashSeen: (h) => h === first.attack.paramHash,
    });
    expect(repeat.isNovel).toBe(false);
  });

  it('win-rate guard: defender catches 80–90% of novel attacks', async () => {
    let caught = 0;
    const N = 2000;
    for (let s = 0; s < N; s += 1) {
      const r = await runRound({ engine: 'local', seed: s, isHashSeen: neverSeen });
      if (r.verdict === 'caught') caught += 1;
    }
    const rate = caught / N;
    expect(rate).toBeGreaterThanOrEqual(0.8);
    expect(rate).toBeLessThanOrEqual(0.9);
  });
});
