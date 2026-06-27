import type { ReactNode } from 'react';

interface Props {
  title?: string;
  children: ReactNode;
  className?: string;
  accent?: 'gold' | 'teal' | 'threat';
}

const ACCENT = {
  gold: 'border-frame-gold',
  teal: 'border-frame-teal',
  threat: 'border-threat',
};

export function PixelPanel({ title, children, className = '', accent = 'teal' }: Props) {
  return (
    <section className={`bg-panel border-4 ${ACCENT[accent]} ${className}`}>
      {title && (
        <header className="font-display text-[10px] uppercase tracking-widest text-coin bg-row px-3 py-2 border-b-4 border-current">
          {title}
        </header>
      )}
      <div className="p-3">{children}</div>
    </section>
  );
}
