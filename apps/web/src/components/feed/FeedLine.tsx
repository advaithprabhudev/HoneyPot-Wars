import { ARCHETYPE_LABELS, type FeedLine as FeedLineData } from '@honeypot/shared';

export function FeedLine({ line }: { line: FeedLineData }) {
  const caught = line.verdict === 'caught';
  return (
    <li className="flex items-center gap-2 font-body text-sm uppercase tracking-wide border-b border-[#1c2127] py-1">
      <span className={caught ? 'text-defender-green' : 'text-threat'}>
        {caught ? '✔' : '✘'}
      </span>
      <span className="text-[#c7cdd4] w-28 truncate">{ARCHETYPE_LABELS[line.archetype]}</span>
      {line.isNovel && <span className="text-coin">★</span>}
      <span className="text-[#7d8794] grow truncate">{line.reason}</span>
      <span className={caught ? 'text-defender-green' : 'text-threat'}>
        {Math.round(line.fusedScore * 100)}
      </span>
    </li>
  );
}
