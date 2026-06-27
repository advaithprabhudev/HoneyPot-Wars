interface Props {
  value: number; // 0..1
  color?: string;
  label?: string;
}

export function ProgressBar({ value, color = 'bg-defender', label }: Props) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between font-body text-sm uppercase tracking-wide text-[#9aa4b0]">
          <span>{label}</span>
          <span>{pct}%</span>
        </div>
      )}
      <div className="h-4 bg-row border-2 border-[#2a2f37] mt-1">
        <div
          className={`h-full ${color}`}
          style={{ width: `${pct}%`, imageRendering: 'pixelated' }}
        />
      </div>
    </div>
  );
}
