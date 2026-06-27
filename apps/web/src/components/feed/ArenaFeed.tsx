import type { FeedLine as FeedLineData } from '@honeypot/shared';
import { PixelPanel } from '../pixel/index';
import { FeedLine } from './FeedLine';

export function ArenaFeed({ feed }: { feed: FeedLineData[] }) {
  return (
    <PixelPanel title="KILL FEED" accent="gold">
      {feed.length === 0 ? (
        <p className="font-body text-sm uppercase text-[#7d8794]">NO ROUNDS YET.</p>
      ) : (
        <ul className="max-h-[22rem] overflow-y-auto pr-1">
          {feed.map((line) => (
            <FeedLine key={line.id} line={line} />
          ))}
        </ul>
      )}
    </PixelPanel>
  );
}
