'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { C } from '@/lib/theme';
import { inputStyle, labelStyle, buttonStyle } from '@/components/Shell';

export function RequestSessionForm({ accountId }: { accountId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [repoUrl, setRepoUrl] = useState('');
  const [deploymentUrl, setDeploymentUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!consent) { setError('You must agree to the testing scope and terms.'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from('session_requests').insert({
        account_id: accountId,
        repo_url: repoUrl,
        deployment_url: deploymentUrl || null,
        notes: notes || null,
        consent_signed: true,
      });
      if (error) throw error;
      router.replace('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit request.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div>
        <label style={labelStyle} htmlFor="repo">GITHUB REPOSITORY URL</label>
        <input id="repo" style={inputStyle} type="url" placeholder="https://github.com/you/your-repo" value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} required />
      </div>
      <div>
        <label style={labelStyle} htmlFor="deploy">DEPLOYED APP URL (OPTIONAL)</label>
        <input id="deploy" style={inputStyle} type="url" placeholder="https://app.example.com" value={deploymentUrl} onChange={(e) => setDeploymentUrl(e.target.value)} />
      </div>
      <div>
        <label style={labelStyle} htmlFor="notes">ANYTHING WE SHOULD KNOW? (OPTIONAL)</label>
        <textarea id="notes" style={{ ...inputStyle, minHeight: '90px', resize: 'vertical' }} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <label style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', fontSize: '17px', letterSpacing: '1px', lineHeight: '1.4', cursor: 'pointer' }}>
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: '4px', width: '18px', height: '18px', accentColor: C.gold }} />
        <span>I AGREE THAT TESTING IS LIMITED TO THE DOMAIN I REGISTERED, NO RAW PAYLOADS OR SECRETS ARE STORED, AND I ACCEPT THE LIMITATION OF LIABILITY.</span>
      </label>

      {error && <p style={{ color: C.red, fontSize: '18px', letterSpacing: '1px', margin: '0' }}>⚠ {error}</p>}

      <button type="submit" style={{ ...buttonStyle, opacity: loading ? 0.6 : 1 }} disabled={loading}>
        {loading ? '...' : '▓▓ REQUEST SESSION ▓▓'}
      </button>
    </form>
  );
}
