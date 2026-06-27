import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'gold' | 'teal' | 'threat' | 'ghost';

const VARIANTS: Record<Variant, string> = {
  gold: 'bg-gold text-panel border-frame-gold',
  teal: 'bg-defender text-panel border-frame-teal',
  threat: 'bg-threat text-white border-[#7a1414]',
  ghost: 'bg-row text-frame-teal border-frame-teal',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

export function PixelButton({ variant = 'gold', children, className = '', ...rest }: Props) {
  return (
    <button
      {...rest}
      className={`font-display text-[10px] uppercase tracking-widest px-4 py-3 border-4 border-b-[6px] border-r-[6px] active:translate-y-[2px] active:border-b-4 disabled:opacity-50 disabled:cursor-not-allowed transition-transform ${VARIANTS[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
