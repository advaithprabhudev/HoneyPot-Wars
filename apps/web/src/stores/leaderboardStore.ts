import { create } from 'zustand';
import type { LeaderboardMetric, RoundResult } from '@honeypot/shared';
import { api } from '../lib/api';

interface LeaderboardState {
  metric: LeaderboardMetric | null;
  rounds: RoundResult[];
  loading: boolean;
  error: string | null;
  refresh: (windowDays?: number) => Promise<void>;
}

export const useLeaderboardStore = create<LeaderboardState>((set) => ({
  metric: null,
  rounds: [],
  loading: false,
  error: null,
  refresh: async (windowDays = 7) => {
    set({ loading: true, error: null });
    try {
      const [metric, rounds] = await Promise.all([
        api.leaderboard(windowDays),
        api.rounds(25, true),
      ]);
      set({ metric, rounds, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },
}));
