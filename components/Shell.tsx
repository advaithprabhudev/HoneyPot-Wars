import Link from 'next/link';
import { C, PRESS } from '@/lib/theme';

// Arcade-framed page shell used by the auth, dashboard, and admin screens.
export function Shell({
  title,
  subtitle,
  children,
  maxWidth = '760px',
  right,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
  right?: React.ReactNode;
}) {
  return (
    <div style={{ background: C.bg, minHeight: '100vh', padding: '18px', fontFamily: 'var(--font-vt323), monospace', color: C.text }}>
      <div style={{ maxWidth, margin: '0 auto' }}>
        <div style={{ padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '8px' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
              <span className="font-press" style={{ fontSize: '12px', color: C.gold }}>[H·W]</span>
              <span style={{ fontSize: '22px' }} title="Honeypot Wars">🍯</span>
            </Link>
            {right}
          </div>
          <h1 className="font-press" style={{ fontSize: '20px', color: C.gold, letterSpacing: '1px', lineHeight: '1.4', margin: '12px 0 0' }}>{title}</h1>
          {subtitle && (
            <p style={{ fontSize: '20px', color: C.cyan, letterSpacing: '2px', margin: '12px 0 0' }}>{subtitle}</p>
          )}
          <div style={{ marginTop: '24px' }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

export const inputStyle: React.CSSProperties = {
  width: '100%',
  background: C.bg,
  color: C.text,
  border: `2px solid ${C.gold}`,
  padding: '12px 14px',
  fontSize: '20px',
  fontFamily: 'var(--font-vt323), monospace',
  letterSpacing: '1px',
  outline: 'none',
};

export const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '18px',
  color: C.text,
  letterSpacing: '2px',
  margin: '0 0 6px',
};

export const buttonStyle: React.CSSProperties = {
  fontFamily: PRESS,
  fontSize: '11px',
  letterSpacing: '1px',
  background: C.bg,
  color: C.gold,
  border: `4px solid ${C.gold}`,
  padding: '14px 18px',
  boxShadow: `4px 4px 0px ${C.gold}`,
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-block',
};
