'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { C } from '@/lib/theme';
import { inputStyle, labelStyle, buttonStyle } from '@/components/Shell';

export function AdminReviewForm({ accountId, sessionRequestId }: { accountId: string; sessionRequestId: string }) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [verdict, setVerdict] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(false);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId, sessionRequestId, body, verdict: verdict || null }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      setDone(true);
      setBody('');
      setVerdict('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
      <div>
        <label style={labelStyle}>VERDICT (OPTIONAL, SHORT)</label>
        <input style={inputStyle} value={verdict} onChange={(e) => setVerdict(e.target.value)} placeholder="e.g. NEEDS ATTENTION" maxLength={80} />
      </div>
      <div>
        <label style={labelStyle}>REVIEW</label>
        <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={body} onChange={(e) => setBody(e.target.value)} required />
      </div>
      {error && <p style={{ color: C.red, fontSize: '17px', margin: 0 }}>⚠ {error}</p>}
      {done && <p style={{ color: C.green, fontSize: '17px', margin: 0 }}>✓ REVIEW POSTED</p>}
      <button type="submit" style={{ ...buttonStyle, fontSize: '10px', padding: '10px 14px', opacity: loading ? 0.6 : 1 }} disabled={loading}>
        {loading ? '...' : '▓ POST REVIEW ▓'}
      </button>
    </form>
  );
}
