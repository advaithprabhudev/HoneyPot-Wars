import { createServer } from 'node:http';
import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '@honeypot/shared';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { connectDb } from './lib/db.js';
import { createApp } from './app.js';
import { registerArena } from './sockets/arena.js';

async function main(): Promise<void> {
  await connectDb();

  const app = createApp();
  const httpServer = createServer(app);
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: env.CORS_ORIGIN },
  });
  registerArena(io);

  httpServer.listen(env.PORT, () => {
    logger.info(`API + Socket.IO listening on :${env.PORT} (engine=${env.ARENA_ENGINE})`);
  });
}

void main();
