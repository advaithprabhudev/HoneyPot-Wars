import type { ReactNode } from 'react';

/** Gold outer + teal inner border — the arcade cabinet wrapping the whole app. */
export function CabinetFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full p-2 sm:p-4 bg-[#07080a]">
      <div className="min-h-[calc(100vh-1rem)] rounded-2xl border-[6px] border-frame-gold p-1">
        <div className="min-h-full rounded-xl border-4 border-frame-teal bg-[#0b0c0f]">
          {children}
        </div>
      </div>
    </div>
  );
}
