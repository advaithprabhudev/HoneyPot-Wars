import { ARCHETYPE_LABELS, type ArenaMetric } from '@honeypot/shared';
import { ProgressBar } from '../pixel/index';

interface Props {
  metric: ArenaMetric;
  archetype?: string;
  connected: boolean;
}

export function HUD({ metric, archetype, connected }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-body">
      <Stat label="DETECTION RATE" value={`${Math.round(metric.detectionRate * 100)}%`} accent="text-defender-green" />
      <Stat label="ROUNDS" value={String(metric.totalRounds)} accent="text-coin" />
      <Stat label="NOVEL SLIPS" value={String(metric.novelSlips)} accent="text-threat" />
      <Stat
        label="LINK"
        value={connected ? 'ONLINE' : 'OFFLINE'}
        accent={connected ? 'text-defender' : 'text-threat'}
      />
      <div className="col-span-2 sm:col-span-4">
        <ProgressBar
          value={metric.detectionRate}
          color="bg-defender-green"
          label={`COVERAGE${archetype ? ` · TARGET ${ARCHETYPE_LABELS[archetype as keyof typeof ARCHETYPE_LABELS] ?? archetype}` : ''}`}
        />
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="bg-row border-2 border-[#243038] px-3 py-2">
      <div className="text-[11px] uppercase tracking-widest text-[#7d8794]">{label}</div>
      <div className={`font-display text-sm ${accent}`}>{value}</div>
    </div>
  );
}
