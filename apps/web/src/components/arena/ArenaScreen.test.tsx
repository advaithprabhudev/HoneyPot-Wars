import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { RoundResult } from '@honeypot/shared';
import { ArenaScreen } from './ArenaScreen';

const round: RoundResult = {
  id: 'r1',
  seed: 1,
  engine: 'local',
  attack: {
    archetype: 'advance_fee',
    params: { urgency: 0.9 },
    paramHash: 'a'.repeat(64),
  },
  verdicts: [
    { agent: 'text', confidence: 0.8, flagged: true, signal: 'urgency elevated' },
    { agent: 'listing_image', confidence: 0.2, flagged: false, signal: 'imageReuse low' },
    { agent: 'price_anomaly', confidence: 0.6, flagged: true, signal: 'priceDeviation' },
    { agent: 'seller_graph', confidence: 0.7, flagged: true, signal: 'ringConnectivity' },
  ],
  fusedScore: 0.71,
  verdict: 'caught',
  isNovel: true,
  reason: 'TEXT caught novel attack — urgency elevated',
  createdAt: new Date().toISOString(),
};

describe('ArenaScreen', () => {
  it('renders the server-sent verdict verbatim (no local recompute)', () => {
    render(<ArenaScreen round={round} />);
    expect(screen.getByText('CAUGHT')).toBeInTheDocument();
    expect(screen.getByText(/urgency elevated/i)).toBeInTheDocument();
  });

  it('shows a standby prompt when no round has arrived', () => {
    render(<ArenaScreen round={null} />);
    expect(screen.getByText(/PRESS START/i)).toBeInTheDocument();
  });
});
