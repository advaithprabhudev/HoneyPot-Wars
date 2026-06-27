'use client';

import React, { useRef, useEffect, useCallback } from 'react';

interface MouseState {
  target: { x: number; y: number };
  current: { x: number; y: number };
}

interface PixelatedCanvasProps {
  className?: string;
  /** Cursor pixel colour. Defaults to the Honeypot Wars gold. */
  color?: string;
  /** Approximate on-screen size (px) of one pixel block. */
  blockSize?: number;
}

const PixelatedCanvas: React.FC<PixelatedCanvasProps> = ({
  className = '',
  color = '#FFD700',
  blockSize = 14,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<MouseState>({
    target: { x: -100, y: -100 },
    current: { x: -100, y: -100 },
  });
  const animationFrameRef = useRef<number>();
  const WRef = useRef<number>(32);
  const HRef = useRef<number>(32);

  const lerp = (start: number, end: number, t: number): number => start * (1 - t) + end * t;
  const map = (value: number, inMin: number, inMax: number, outMin: number, outMax: number): number =>
    ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Internal resolution tracks the viewport aspect ratio so the cursor stays
    // round (not stretched), with each pixel ~blockSize px on screen.
    WRef.current = Math.max(8, Math.ceil(window.innerWidth / blockSize));
    HRef.current = Math.max(8, Math.ceil(window.innerHeight / blockSize));
    canvas.width = WRef.current;
    canvas.height = HRef.current;
  }, [blockSize]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = WRef.current;
    const H = HRef.current;

    // Fade the previous frame toward transparent — keeps the overlay see-through
    // while leaving a short pixel trail behind the cursor.
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';

    const mouse = mouseRef.current;
    mouse.current.x = lerp(mouse.current.x, mouse.target.x, 0.18);
    mouse.current.y = lerp(mouse.current.y, mouse.target.y, 0.18);

    ctx.beginPath();
    ctx.arc(mouse.current.x, mouse.current.y, 1.2, 0, Math.PI * 2, false);
    ctx.fillStyle = color;
    ctx.fill();

    animationFrameRef.current = requestAnimationFrame(render);
  }, [color]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!canvasRef.current) return;
    const mouse = mouseRef.current;
    mouse.target.x = map(event.clientX, 0, window.innerWidth, 0, WRef.current);
    mouse.target.y = map(event.clientY, 0, window.innerHeight, 0, HRef.current);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    resize();
    animationFrameRef.current = requestAnimationFrame(render);

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [resize, render, handleMouseMove]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{ width: '100%', height: '100%', display: 'block', imageRendering: 'pixelated' }}
    />
  );
};

export { PixelatedCanvas };
