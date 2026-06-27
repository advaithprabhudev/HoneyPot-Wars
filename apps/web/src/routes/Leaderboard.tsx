import { useEffect } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ARCHETYPE_LABELS } from '@honeypot/shared';
import { useLeaderboardStore } from '../stores/leaderboardStore';
import { PixelButton, PixelPanel } from '../components/pixel/index';

export function Leaderboard() {
  const { metric, rounds, loading, error, refresh } = useLeaderboardStore();

  useEffect(() => {
    void refresh(7);
  }, [refresh]);

  const trend = [...rounds]
    .reverse()
    .map((r, i) => ({ i: i + 1, rate: Math.round(r.fusedScore * 100) }));

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h2 className="font-display text-coin text-base tracking-widest grow">COVERAGE LEADERBOARD</h2>
        <PixelButton variant="ghost" onClick={() => void refresh(7)}>
          REFRESH
        </PixelButton>
      </div>

      {error && <p className="font-body text-threat uppercase">API OFFLINE — {error}</p>}

      <div className="grid sm:grid-cols-3 gap-4 font-body">
        <Stat label="DETECTION RATE (NOVEL)" value={metric ? `${Math.round(metric.detectionRate * 100)}%` : '—'} accent="text-defender-green" />
        <Stat label="TOTAL ROUNDS" value={metric ? String(metric.totalRounds) : '—'} accent="text-coin" />
        <Stat label="NOVEL SLIPS" value={metric ? String(metric.novelSlips) : '—'} accent="text-threat" />
      </div>

      <PixelPanel title="FUSED-SCORE TREND (NOVEL ROUNDS)" accent="teal">
        {trend.length === 0 ? (
          <p className="font-body uppercase text-[#7d8794]">{loading ? 'LOADING…' : 'NO DATA YET — RUN THE ARENA.'}</p>
        ) : (
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={trend}>
                <CartesianGrid stroke="#1c2127" />
                <XAxis dataKey="i" stroke="#7d8794" />
                <YAxis domain={[0, 100]} stroke="#7d8794" />
                <Tooltip contentStyle={{ background: '#0E0F12', border: '2px solid #5FD4C4' }} />
                <Line type="stepAfter" dataKey="rate" stroke="#3DA838" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </PixelPanel>

      <PixelPanel title="RECENT NOVEL ROUNDS" accent="gold">
        {rounds.length === 0 ? (
          <p className="font-body uppercase text-[#7d8794]">NO NOVEL ROUNDS YET.</p>
        ) : (
          <table className="w-full font-body text-sm uppercase">
            <thead className="text-[#7d8794] text-left">
              <tr>
                <th className="py-1">ARCHETYPE</th>
                <th>VERDICT</th>
                <th>FUSED</th>
                <th className="hidden sm:table-cell">REASON</th>
              </tr>
            </thead>
            <tbody>
              {rounds.map((r) => (
                <tr key={r.id} className="border-t border-[#1c2127]">
                  <td className="py-1 text-[#c7cdd4]">{ARCHETYPE_LABELS[r.attack.archetype]}</td>
                  <td className={r.verdict === 'caught' ? 'text-defender-green' : 'text-threat'}>
                    {r.verdict}
                  </td>
                  <td>{Math.round(r.fusedScore * 100)}</td>
                  <td className="hidden sm:table-cell text-[#7d8794] truncate max-w-xs">{r.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </PixelPanel>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="bg-row border-4 border-[#243038] px-4 py-3">
      <div className="text-[12px] uppercase tracking-widest text-[#7d8794]">{label}</div>
      <div className={`font-display text-lg ${accent}`}>{value}</div>
    </div>
  );
}
