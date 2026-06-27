import { AGENT_LABELS, type AgentVerdict } from '@honeypot/shared';
import { ProgressBar, Sprite } from '../pixel/index';

const GLYPHS: Record<string, string> = {
  text: '📝',
  listing_image: '🖼️',
  price_anomaly: '💰',
  seller_graph: '🕸️',
};

export function DefenderSwarm({ verdicts }: { verdicts: AgentVerdict[] }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {verdicts.length === 0
        ? Array.from({ length: 4 }).map((_, i) => <Idle key={i} />)
        : verdicts.map((v) => (
            <div
              key={v.agent}
              className={`bg-row border-2 px-2 py-2 ${v.flagged ? 'border-defender-green' : 'border-[#243038]'}`}
            >
              <div className="flex items-center gap-2">
                <Sprite glyph={GLYPHS[v.agent] ?? '🛡️'} size={22} />
                <span className="font-display text-[8px] tracking-widest text-frame-teal">
                  {AGENT_LABELS[v.agent]}
                </span>
                <span className={`ml-auto font-display text-[8px] ${v.flagged ? 'text-defender-green' : 'text-[#7d8794]'}`}>
                  {v.flagged ? 'FLAG' : '----'}
                </span>
              </div>
              <ProgressBar value={v.confidence} color={v.flagged ? 'bg-defender-green' : 'bg-defender'} />
            </div>
          ))}
    </div>
  );
}

function Idle() {
  return (
    <div className="bg-row border-2 border-[#243038] px-2 py-2 opacity-60">
      <div className="font-display text-[8px] tracking-widest text-[#7d8794]">STANDBY</div>
      <ProgressBar value={0} />
    </div>
  );
}
