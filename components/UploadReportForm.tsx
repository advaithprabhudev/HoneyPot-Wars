'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { C } from '@/lib/theme';
import { inputStyle, labelStyle, buttonStyle } from '@/components/Shell';

export function UploadReportForm({ accountId }: { accountId: string }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [title, setTitle] = useState('');
  const [reportType, setReportType] = useState<'technical' | 'summary' | 'other'>('technical');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setDone(false);
    const form = new FormData(e.currentTarget);
    form.set('accountId', accountId);
    form.set('title', title);
    form.set('reportType', reportType);
    setLoading(true);
    try {
      const res = await fetch('/api/admin/reports', { method: 'POST', body: form });
      if (!res.ok) throw new Error((await res.json()).error || 'Upload failed');
      setDone(true);
      setTitle('');
      formRef.current?.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div>
        <label style={labelStyle} htmlFor="title">REPORT TITLE</label>
        <input id="title" style={inputStyle} value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Q2 Coverage Assessment" />
      </div>
      <div>
        <label style={labelStyle} htmlFor="type">REPORT TYPE</label>
        <select id="type" style={inputStyle} value={reportType} onChange={(e) => setReportType(e.target.value as typeof reportType)}>
          <option value="technical">TECHNICAL</option>
          <option value="summary">EXECUTIVE SUMMARY</option>
          <option value="other">OTHER</option>
        </select>
      </div>
      <div>
        <label style={labelStyle} htmlFor="file">FILE (PDF, MAX 25MB)</label>
        <input id="file" name="file" type="file" accept="application/pdf,.pdf" required style={{ ...inputStyle, padding: '10px' }} />
      </div>
      {error && <p style={{ color: C.red, fontSize: '18px', margin: '0' }}>⚠ {error}</p>}
      {done && <p style={{ color: C.green, fontSize: '18px', margin: '0' }}>✓ REPORT UPLOADED</p>}
      <button type="submit" style={{ ...buttonStyle, opacity: loading ? 0.6 : 1 }} disabled={loading}>
        {loading ? 'UPLOADING...' : '▓▓ UPLOAD REPORT ▓▓'}
      </button>
    </form>
  );
}
