/**
 * Seeded PRNG (mulberry32) + string seeding (FNV-1a).
 *
 * Pure TypeScript — zero React imports. Thread an `Rng` through generation
 * and simulation instead of calling the Math.random-backed globals in
 * `utils/rng.ts`. Storing `runSeed` in the save unlocks daily seeded runs,
 * verifiable leaderboards, deterministic replays, and non-flaky balance tests.
 */

/** Minimal RNG contract: returns a float in [0, 1). */
export interface Rng {
  next(): number;
}

/** mulberry32 — small, fast, good enough for game randomness. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return {
    next(): number {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

/** FNV-1a 32-bit hash: stable string -> seed mapping. */
export function seedFromString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Fresh unpredictable seed for normal runs. */
export function randomSeed(): number {
  return (Math.random() * 0x7fffffff) | 0;
}

/** `YYYY-MM-DD` (UTC) key for the daily challenge. */
export function todayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Everyone gets the same dungeon for the same calendar day. */
export function getDailySeed(date = new Date()): number {
  return getDailySeedForKey(todayKey(date));
}

/** Seed for an explicit `YYYY-MM-DD` daily key (avoids date-parsing pitfalls). */
export function getDailySeedForKey(key: string): number {
  return seedFromString(`hafizn24-daily:${key}`);
}

/**
 * Derive a per-floor stream from the run seed so floor N is identical for a
 * given seed no matter how the player got there (no ordering dependence).
 */
export function rngForFloor(runSeed: number, floor: number): Rng {
  return mulberry32(seedFromString(`${runSeed}:floor:${floor}`));
}

// --- Seeded counterparts of the utils/rng.ts globals -----------------------

export function rngFloat(rng: Rng, min: number, max: number): number {
  return rng.next() * (max - min) + min;
}

export function rngInt(rng: Rng, min: number, max: number): number {
  return Math.floor(rng.next() * (max - min + 1)) + min;
}

export function rngChance(rng: Rng, probability: number): boolean {
  return rng.next() < probability;
}

export function rngPick<T>(rng: Rng, arr: T[]): T {
  return arr[Math.floor(rng.next() * arr.length)];
}

export function rngShuffle<T>(rng: Rng, arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
