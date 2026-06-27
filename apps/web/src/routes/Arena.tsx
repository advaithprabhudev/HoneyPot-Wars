import { useEffect } from 'react';
import { useArenaStore } from '../stores/arenaStore';
import { getSocket, startArena, stopArena } from '../lib/socket';
import { PixelButton } from '../components/pixel/index';
import { HUD } from '../components/arena/HUD';
import { ArenaScreen } from '../components/arena/ArenaScreen';
import { ArenaFeed } from '../components/feed/ArenaFeed';

export function Arena() {
  const { current, feed, metric, connected, running } = useArenaStore();

  useEffect(() => {
    getSocket();
    return () => stopArena();
  }, []);

  return (
    <div className="p-4 sm:p-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-coin text-base tracking-widest grow">LIVE ARENA</h2>
        {running ? (
          <PixelButton variant="threat" onClick={stopArena}>
            STOP
          </PixelButton>
        ) : (
          <PixelButton variant="teal" onClick={() => startArena('local')}>
            START
          </PixelButton>
        )}
      </div>

      <HUD metric={metric} archetype={current?.attack.archetype} connected={connected} />

      <div className="grid lg:grid-cols-[2fr_1fr] gap-4">
        <ArenaScreen round={current} />
        <ArenaFeed feed={feed} />
      </div>
    </div>
  );
}
