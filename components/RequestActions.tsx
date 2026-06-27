'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { C, PRESS } from '@/lib/theme';

export function RequestActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(action: 'approve' | 'reject') {
    setLoading(action);
    setError(null);
    try {
      const res = await fetch('/api/admin/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(null);
    }
  }

  const btn = (color: string): React.CSSProperties => ({
    fontFamily: PRESS, fontSize: '9px', letterSpacing: '1px', background: C.bg, color,
    border: `2px solid ${color}`, padding: '8px 12px', cursor: 'pointer',
  });

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
      <button onClick={() => act('approve')} disabled={loading !== null} style={btn(C.green)}>{loading === 'approve' ? '...' : 'APPROVE'}</button>
      <button onClick={() => act('reject')} disabled={loading !== null} style={btn(C.red)}>{loading === 'reject' ? '...' : 'REJECT'}</button>
      {error && <span style={{ color: C.red, fontSize: '16px' }}>{error}</span>}
    </div>
  );
}
