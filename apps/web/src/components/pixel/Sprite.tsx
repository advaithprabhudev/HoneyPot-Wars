interface Props {
  glyph: string;
  size?: number;
  className?: string;
  title?: string;
}

/** A chunky emoji/char sprite rendered with pixelated edges. */
export function Sprite({ glyph, size = 48, className = '', title }: Props) {
  return (
    <span
      role="img"
      aria-label={title}
      title={title}
      className={`inline-block pixelated leading-none ${className}`}
      style={{ fontSize: size }}
    >
      {glyph}
    </span>
  );
}
