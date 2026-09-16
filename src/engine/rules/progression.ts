/**
 * Pure progression math. ZERO React imports.
 *
 * `planLevelUps` computes the full result of gaining EXP (including chained
 * multi-level-ups) without touching any store; `gameStore.gainExp` delegates
 * to it. Same shape for `applyStatPointToStats`.
 */
import type { ClassDefinition, Stats, StatType } from '../../types/game';
import { calcExpForLevel } from '../../utils/rng';

export { calcExpForLevel };

export interface LevelUpInput {
  level: number;
  exp: number;
  expToNext: number;
  stats: Stats;
  statPoints: number;
}

export interface LevelUpResult {
  level: number;
  exp: number;
  expToNext: number;
  stats: Stats;
  statPoints: number;
  messages: string[];
}

/** Points granted per level-up for manual distribution. */
export const STAT_POINTS_PER_LEVEL = 3;
/** Max HP/MP granted per point put into hp/mp. */
export const HP_PER_STAT_POINT = 10;
export const MP_PER_STAT_POINT = 5;

/**
 * Pure EXP application. Level-ups refill HP/MP to the new maximums and grant
 * stat points; growth comes from the class definition.
 */
export function planLevelUps(
  input: LevelUpInput,
  amount: number,
  classDef: ClassDefinition | undefined,
): LevelUpResult {
  const messages: string[] = [];
  let newExp = input.exp + amount;
  let newLevel = input.level;
  const newStats = { ...input.stats };
  let statPoints = input.statPoints ?? 0;
  let threshold = input.expToNext;

  while (newExp >= threshold) {
    newExp -= threshold;
    newLevel++;
    if (classDef) {
      newStats.str += classDef.growth.str;
      newStats.dex += classDef.growth.dex;
      newStats.int += classDef.growth.int;
      newStats.maxHp += classDef.growth.hp;
      newStats.maxMp += classDef.growth.mp;
      newStats.def += classDef.growth.def ?? 0;
      newStats.hp = newStats.maxHp;
      newStats.mp = newStats.maxMp;
    }
    statPoints += STAT_POINTS_PER_LEVEL;
    threshold = calcExpForLevel(newLevel);
    messages.push(`LEVEL UP! Now level ${newLevel}! (+${STAT_POINTS_PER_LEVEL} stat points)`);
  }

  return { level: newLevel, exp: newExp, expToNext: threshold, stats: newStats, statPoints, messages };
}

export interface StatPointResult {
  stats: Stats;
  spent: boolean;
}

/** Pure single-point allocation. Returns unspent stats when `stat` is unknown. */
export function applyStatPointToStats(stats: Stats, stat: StatType): StatPointResult {
  const next = { ...stats };
  switch (stat) {
    case 'str':
      next.str += 1;
      break;
    case 'dex':
      next.dex += 1;
      break;
    case 'int':
      next.int += 1;
      break;
    case 'hp':
      next.maxHp += HP_PER_STAT_POINT;
      next.hp = Math.min(next.maxHp, next.hp + HP_PER_STAT_POINT);
      break;
    case 'mp':
      next.maxMp += MP_PER_STAT_POINT;
      next.mp = Math.min(next.maxMp, next.mp + MP_PER_STAT_POINT);
      break;
    case 'def':
      next.def += 1;
      break;
    default:
      return { stats, spent: false };
  }
  return { stats: next, spent: true };
}
