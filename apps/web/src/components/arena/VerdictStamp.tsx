import type { Verdict } from '@honeypot/shared';

export function VerdictStamp({ verdict, roundId }: { verdict: Verdict; roundId: string }) {
  const caught = verdict === 'caught';
  return (
    <div
      key={roundId}
      className={`anim-stamp inline-block font-display text-lg px-4 py-2 border-4 ${
        caught ? 'text-defender-green border-defender-green' : 'text-threat border-threat'
      }`}
    >
      {caught ? 'CAUGHT' : 'SLIPPED'}
    </div>
  );
}
