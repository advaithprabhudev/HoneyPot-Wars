import type { LeaderboardMetric, RoundResult } from '@honeypot/shared';

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

export interface TaxonomyResponse {
  archetypes: string[];
  archetypeLabels: Record<string, string>;
  agents: string[];
  agentLabels: Record<string, string>;
  paramKeys: string[];
  agentParams: Record<string, string[]>;
}

export const api = {
  health: () => get<{ status: string; engine: string; mongo: string }>('/health'),
  leaderboard: (windowDays = 7) =>
    get<LeaderboardMetric>(`/leaderboard?windowDays=${windowDays}`),
  rounds: (limit = 50, novelOnly = false) =>
    get<RoundResult[]>(`/rounds?limit=${limit}&novelOnly=${novelOnly}`),
  taxonomy: () => get<TaxonomyResponse>('/taxonomy'),
  contact: async (body: { name: string; email: string; company?: string; message: string }) => {
    const res = await fetch(`${BASE}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({ error: 'request failed' }))) as { error: string };
      throw new Error(err.error);
    }
    return (await res.json()) as { received: true };
  },
};
