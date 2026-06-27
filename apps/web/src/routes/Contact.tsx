import { useState } from 'react';
import { api } from '../lib/api';
import { PixelButton, PixelInput, PixelPanel, PixelTextarea } from '../components/pixel/index';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export function Contact() {
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' });
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

  const update = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setError('');
    try {
      await api.contact({
        name: form.name,
        email: form.email,
        company: form.company || undefined,
        message: form.message,
      });
      setStatus('sent');
      setForm({ name: '', email: '', company: '', message: '' });
    } catch (err) {
      setStatus('error');
      setError((err as Error).message);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <h2 className="font-display text-coin text-base tracking-widest mb-4">REQUEST COVERAGE REPORT</h2>
      <PixelPanel title="GET YOUR DETECTION-RATE BRIEF" accent="gold">
        <form onSubmit={submit} className="flex flex-col gap-3">
          <PixelInput placeholder="NAME" required value={form.name} onChange={update('name')} />
          <PixelInput
            type="email"
            placeholder="EMAIL"
            required
            value={form.email}
            onChange={update('email')}
          />
          <PixelInput placeholder="COMPANY (OPTIONAL)" value={form.company} onChange={update('company')} />
          <PixelTextarea
            placeholder="WHAT MARKETPLACE ARE YOU DEFENDING?"
            rows={4}
            required
            value={form.message}
            onChange={update('message')}
          />
          <div className="flex items-center gap-3">
            <PixelButton type="submit" variant="teal" disabled={status === 'sending'}>
              {status === 'sending' ? 'SENDING…' : 'SEND REQUEST'}
            </PixelButton>
            {status === 'sent' && (
              <span className="font-body uppercase text-defender-green">RECEIVED — WE WILL BE IN TOUCH.</span>
            )}
            {status === 'error' && (
              <span className="font-body uppercase text-threat">{error || 'SOMETHING WENT WRONG.'}</span>
            )}
          </div>
        </form>
      </PixelPanel>
    </div>
  );
}
