import type { ArenaMetric, Engine, FeedLine, RoundResult } from './types.js';
import type { GeneratedAttack } from './schemas.js';

/** Socket.IO event names — defined once, never hard-coded elsewhere. */
export const SOCKET_EVENTS = {
  arenaStart: 'arena:start',
  arenaRound: 'arena:round',
  arenaFeed: 'arena:feed',
  arenaMetric: 'arena:metric',
  arenaStop: 'arena:stop',
  playerAttack: 'player:attack',
} as const;

export interface ClientToServerEvents {
  'arena:start': (payload: { engine?: Engine; seed?: number }) => void;
  'arena:stop': (payload: Record<string, never>) => void;
  'player:attack': (payload: GeneratedAttack) => void;
}

export interface ServerToClientEvents {
  'arena:round': (payload: RoundResult) => void;
  'arena:feed': (payload: FeedLine) => void;
  'arena:metric': (payload: ArenaMetric) => void;
}
