'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { C } from '@/lib/theme';
import { inputStyle, labelStyle, buttonStyle } from '@/components/Shell';

export function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [registeredDomain, setRegisteredDomain] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { company_name: companyName, registered_domain: registeredDomain },
          },
        });
        if (error) throw error;
        // If email confirmation is on, there is no session yet.
        if (!data.session) {
          setNotice('Account created. Check your email to confirm, then log in.');
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      router.replace('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div>
        <label style={labelStyle} htmlFor="email">EMAIL</label>
        <input id="email" style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
      </div>
      <div>
        <label style={labelStyle} htmlFor="password">PASSWORD</label>
        <input id="password" style={inputStyle} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} />
      </div>
      {mode === 'signup' && (
        <>
          <div>
            <label style={labelStyle} htmlFor="company">COMPANY NAME</label>
            <input id="company" style={inputStyle} type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
          </div>
          <div>
            <label style={labelStyle} htmlFor="domain">REGISTERED DOMAIN</label>
            <input id="domain" style={inputStyle} type="text" placeholder="example.com" value={registeredDomain} onChange={(e) => setRegisteredDomain(e.target.value)} />
          </div>
        </>
      )}

      {error && <p style={{ color: C.red, fontSize: '18px', letterSpacing: '1px', margin: '0' }}>⚠ {error}</p>}
      {notice && <p style={{ color: C.green, fontSize: '18px', letterSpacing: '1px', margin: '0' }}>✓ {notice}</p>}

      <button type="submit" style={{ ...buttonStyle, opacity: loading ? 0.6 : 1 }} disabled={loading}>
        {loading ? '...' : mode === 'signup' ? '▓▓ CREATE ACCOUNT ▓▓' : '▓▓ LOG IN ▓▓'}
      </button>

      <p style={{ fontSize: '18px', color: C.text, letterSpacing: '1px', margin: '4px 0 0' }}>
        {mode === 'signup' ? (
          <>ALREADY HAVE AN ACCOUNT? <Link href="/login" style={{ color: C.cyan }}>LOG IN</Link></>
        ) : (
          <>NO ACCOUNT YET? <Link href="/signup" style={{ color: C.cyan }}>SIGN UP</Link></>
        )}
      </p>
    </form>
  );
}
