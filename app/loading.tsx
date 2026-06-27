'use client';

import dynamic from 'next/dynamic';

const WipePlayer = dynamic(() => import('@/components/WipePlayer'), {
  ssr: false,
  loading: () => null,
});

export default function Loading() {
  return (
    <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', background: '#0D0D0D', zIndex: 9998 }}>
      <WipePlayer />
    </div>
  );
}
