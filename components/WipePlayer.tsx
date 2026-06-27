'use client';

import { Player } from '@remotion/player';
import { GridPixelateWipe } from '@/components/ui/grid-pixelate-wipe';

const PRESS = 'var(--font-press-start), monospace';

function Panel({ label, color }: { label: string; color: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: '#0D0D0D',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 18,
        color,
        fontFamily: PRESS,
        fontSize: 34,
        letterSpacing: '2px',
        textAlign: 'center',
      }}
    >
      <span>🍯</span>
      <span>{label}</span>
    </div>
  );
}

function WipeScene() {
  return (
    <GridPixelateWipe
      cols={16}
      rows={9}
      pattern="wave"
      transitionStart={18}
      transitionDuration={40}
      cellFadeFrames={6}
      from={<Panel label="LOADING" color="#FFD700" />}
      to={<Panel label="HONEYPOT WARS" color="#00E5FF" />}
    />
  );
}

export default function WipePlayer() {
  return (
    <Player
      component={WipeScene}
      durationInFrames={90}
      fps={30}
      compositionWidth={1280}
      compositionHeight={720}
      controls={false}
      autoPlay
      loop
      clickToPlay={false}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
