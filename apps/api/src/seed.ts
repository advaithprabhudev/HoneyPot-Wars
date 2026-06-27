import { connectDb, disconnectDb } from './lib/db.js';
import { logger } from './lib/logger.js';
import { playRound } from './services/arenaService.js';
import { computeLeaderboard } from './services/roundStore.js';

/** Seed the store with a batch of deterministic local rounds. */
async function seed(): Promise<void> {
  await connectDb();
  const N = 200;
  for (let i = 0; i < N; i += 1) {
    await playRound({ engine: 'local', seed: 1000 + i });
  }
  const m = computeLeaderboard(3650);
  logger.info(
    { detectionRate: m.detectionRate.toFixed(3), totalRounds: m.totalRounds, novelSlips: m.novelSlips },
    `seeded ${N} rounds`,
  );
  await disconnectDb();
}

void seed();
