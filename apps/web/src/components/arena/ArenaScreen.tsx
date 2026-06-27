import type { RoundResult } from '@honeypot/shared';
import { PixelPanel } from '../pixel/index';
import { GeneratorBoss } from './GeneratorBoss';
import { DefenderSwarm } from './DefenderSwarm';
import { VerdictStamp } from './VerdictStamp';

export function ArenaScreen({ round }: { round: RoundResult | null }) {
  return (
    <PixelPanel title="ARENA" accent="teal" className="pixel-sky">
      <div className="bg-[#0b0c0f]/85 border-2 border-[#243038] p-4">
        <div className="grid md:grid-cols-[1fr_auto_2fr] gap-4 items-center">
          <GeneratorBoss round={round} />
          <div className="text-center font-display text-coin text-xs hidden md:block">VS</div>
          <div className="flex flex-col gap-3">
            <DefenderSwarm verdicts={round?.verdicts ?? []} />
            <div className="min-h-[3rem] flex items-center justify-between">
              {round ? (
                <>
                  <VerdictStamp verdict={round.verdict} roundId={round.id} />
                  <span className="font-body text-sm uppercase text-[#9aa4b0] max-w-[60%] text-right">
                    {round.reason}
                  </span>
                </>
              ) : (
                <span className="font-body text-sm uppercase text-[#7d8794]">
                  PRESS START TO RUN THE SWARM
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </PixelPanel>
  );
}
