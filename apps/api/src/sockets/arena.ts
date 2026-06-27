import type { Server, Socket } from 'socket.io';
import {
  SOCKET_EVENTS,
  arenaStartSchema,
  playerAttackSchema,
  type ArenaMetric,
  type ClientToServerEvents,
  type Engine,
  type FeedLine,
  type RoundResult,
  type ServerToClientEvents,
} from '@honeypot/shared';
import { paramHash } from '../lib/hash.js';
import { logger } from '../lib/logger.js';
import { playRound } from '../services/arenaService.js';

type ArenaSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

const LOOP_INTERVAL_MS = 1400;

export function registerArena(io: Server<ClientToServerEvents, ServerToClientEvents>): void {
  io.on('connection', (socket: ArenaSocket) => {
    let loop: NodeJS.Timeout | null = null;

    const broadcast = (round: RoundResult, feed: FeedLine, metric: ArenaMetric) => {
      socket.emit(SOCKET_EVENTS.arenaRound, round);
      socket.emit(SOCKET_EVENTS.arenaFeed, feed);
      socket.emit(SOCKET_EVENTS.arenaMetric, metric);
    };

    const tick = async (payload: Parameters<typeof playRound>[0]) => {
      try {
        const { round, feed, metric } = await playRound(payload);
        broadcast(round, feed, metric);
      } catch (err) {
        logger.error({ err: (err as Error).message }, 'arena round failed');
      }
    };

    const stop = () => {
      if (loop) {
        clearInterval(loop);
        loop = null;
      }
    };

    socket.on(SOCKET_EVENTS.arenaStart, (raw) => {
      const parsed = arenaStartSchema.safeParse(raw ?? {});
      if (!parsed.success) return;
      stop();
      const engine = parsed.data.engine;
      void tick(parsed.data);
      loop = setInterval(() => void tick({ engine: engine as Engine | undefined }), LOOP_INTERVAL_MS);
    });

    socket.on(SOCKET_EVENTS.playerAttack, (raw) => {
      const parsed = playerAttackSchema.safeParse(raw);
      if (!parsed.success) return;
      const attack = { ...parsed.data, paramHash: paramHash(parsed.data.params) };
      void tick({ attack });
    });

    socket.on(SOCKET_EVENTS.arenaStop, stop);
    socket.on('disconnect', stop);
  });
}
