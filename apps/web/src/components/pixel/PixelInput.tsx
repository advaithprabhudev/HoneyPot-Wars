import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

const base =
  'w-full bg-row text-frame-teal font-body text-lg uppercase tracking-wide px-3 py-2 border-4 border-frame-teal focus:outline-none focus:border-coin placeholder:text-[#5a6470]';

export function PixelInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${base} ${props.className ?? ''}`} />;
}

export function PixelTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${base} resize-none ${props.className ?? ''}`} />;
}
