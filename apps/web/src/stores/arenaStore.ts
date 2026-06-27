import { create } from 'zustand';
import type { ArenaMetric, FeedLine, RoundResult } from '@honeypot/shared';

const MAX_FEED = 40;

interface ArenaState {
  connected: boolean;
  running: boolean;
  current: RoundResult | null;
  feed: FeedLine[];
  metric: ArenaMetric;
  pushRound: (round: RoundResult) => void;
  pushFeed: (line: FeedLine) => void;
  setMetric: (metric: ArenaMetric) => void;
}

export const useArenaStore = create<ArenaState>((set) => ({
  connected: false,
  running: false,
  current: null,
  feed: [],
  metric: { detectionRate: 0, totalRounds: 0, novelSlips: 0 },
  pushRound: (round) => set({ current: round }),
  pushFeed: (line) => set((s) => ({ feed: [line, ...s.feed].slice(0, MAX_FEED) })),
  setMetric: (metric) => set({ metric }),
}));
