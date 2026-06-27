import { io, type Socket } from 'socket.io-client';
import {
  SOCKET_EVENTS,
  type ClientToServerEvents,
  type ServerToClientEvents,
} from '@honeypot/shared';
import { useArenaStore } from '../stores/arenaStore';

const URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:4000';

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

/**
 * The ONLY writer of round data into the store (CLAUDE.md §8). Components read
 * from the store; they never recompute verdicts from the payload.
 */
export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (socket) return socket;
  socket = io(URL, { autoConnect: true, transports: ['websocket', 'polling'] });

  const store = useArenaStore.getState();

  socket.on('connect', () => useArenaStore.setState({ connected: true }));
  socket.on('disconnect', () => useArenaStore.setState({ connected: false }));
  socket.on(SOCKET_EVENTS.arenaRound, (round) => store.pushRound(round));
  socket.on(SOCKET_EVENTS.arenaFeed, (line) => store.pushFeed(line));
  socket.on(SOCKET_EVENTS.arenaMetric, (metric) => store.setMetric(metric));

  return socket;
}

export function startArena(engine: 'local' | 'llm' = 'local'): void {
  getSocket().emit(SOCKET_EVENTS.arenaStart, { engine });
  useArenaStore.setState({ running: true });
}

export function stopArena(): void {
  getSocket().emit(SOCKET_EVENTS.arenaStop, {});
  useArenaStore.setState({ running: false });
}
