import { ARCHETYPE_LABELS, type RoundResult } from '@honeypot/shared';
import { Sprite } from '../pixel/index';

export function GeneratorBoss({ round }: { round: RoundResult | null }) {
  const archetype = round?.attack.archetype;
  return (
    <div className="flex flex-col items-center gap-2">
      <Sprite glyph="👾" size={64} className="anim-hop" title="Generator boss" />
      <div className="font-display text-[10px] text-threat tracking-widest">GENERATOR</div>
      <div className="font-body text-sm uppercase text-[#9aa4b0] text-center min-h-[1.5rem]">
        {archetype ? ARCHETYPE_LABELS[archetype] : 'AWAITING START'}
      </div>
      {round?.isNovel && (
        <div className="font-display text-[8px] text-coin anim-blink tracking-widest">★ NOVEL</div>
      )}
    </div>
  );
}
