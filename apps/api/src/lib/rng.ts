export type Rng = () => number

// mulberry32 — fast 32-bit PRNG; deterministic given the same seed.
// Only source of randomness in the local engine. No Math.random, no Date.now.
export function mulberry32(seed: number): Rng {
  let s = seed >>> 0
  return () => {
    s += 0x6d2b79f5
    let z = s
    z = Math.imul(z ^ (z >>> 15), z | 1)
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61)
    return ((z ^ (z >>> 14)) >>> 0) / 0x100000000
  }
}
