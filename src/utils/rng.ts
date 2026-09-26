/**
 * Legacy Math.random globals — thin wrappers over the pure engine.
 *
 * New code should prefer `src/engine/rng.ts` (seeded `Rng`) + `src/engine/rules/damage.ts`
 * (pure math). These wrappers stay for UI call-sites that don't thread a seed
 * (traps, crit rolls, shop pity) so there is exactly one copy of each formula.
 */
import {
  baseDamage,
  critChanceForDex,
  dodgeChanceForDex,
} from '../engine/rules/damage';

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function chance(probability: number): boolean {
  return Math.random() < probability;
}

export function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/** Single source of truth lives in `engine/rules/damage.ts` — this just adds variance. */
export function calcDamage(attackerAtk: number, defenderDef: number): number {
  const base = baseDamage(attackerAtk, defenderDef);
  const variance = randomFloat(0.85, 1.15);
  return Math.floor(base * variance);
}

/** Delegates to `critChanceForDex` — one copy of the cap (40%). */
export function calcCritChance(dex: number): number {
  return critChanceForDex(dex);
}

/**
 * Delegates to `dodgeChanceForDex` — one copy of the cap (30%).
 */
export function calcDodgeChance(playerDex: number, enemyDex: number, guarding = false): number {
  return dodgeChanceForDex(playerDex, enemyDex, guarding);
}

export function calcExpForLevel(level: number): number {
  return Math.floor(50 * Math.pow(level, 1.5));
}

export function getRarityColor(rarity: string): string {
  switch (rarity) {
    case 'common': return '#cccccc';
    case 'uncommon': return '#00ff41';
    case 'rare': return '#00ffff';
    case 'epic': return '#bf00ff';
    default: return '#cccccc';
  }
}
