/**
 * Headless auto-play simulator for balance testing. Pure TypeScript, no React.
 *
 * Mirrors the *intended* play pattern (no town trips, no purchased gear) with
 * a fixed policy: skill when MP allows, potion below 35% HP, otherwise basic
 * attack; level-up stat points go greedily into the class primary stat.
 * Floors are generated with the real `generateDungeon` under a per-floor
 * seeded stream, so results are fully deterministic per seed.
 */
import { CLASSES } from '../../game/data/classes';
import { generateDungeon } from '../../game/systems/dungeonGenerator';
import { mulberry32, rngForFloor, seedFromString, type Rng } from '../rng';
import {
  critChanceForDex,
  dodgeChanceForDex,
  getPrimaryAttack,
  getPrimaryStatForClass,
  getPlayerDefTotal,
  getSkillAttack,
  rollDamageWithVariance,
  trapDexForFloor,
} from '../rules/damage';
import { planLevelUps } from '../rules/progression';
import type { CharacterClass, Enemy, Stats } from '../../types/game';

export interface SimOptions {
  /** Number of runs per class. */
  runsPerClass?: number;
  /** Base seed; run i uses baseSeed + i. */
  baseSeed?: number;
  /** Stop descending past this floor (survived = reached). */
  maxFloor?: number;
  /** Minor HP potions at run start (mirrors new-game inventory). */
  startPotions?: number;
  potionHeal?: number;
}

export interface RunResult {
  classId: CharacterClass;
  deathFloor: number;
  deathCause: 'monster' | 'trap' | 'survived';
  level: number;
}

interface SimFighter {
  class: CharacterClass;
  level: number;
  exp: number;
  expToNext: number;
  stats: Stats;
  statPoints: number;
  potions: number;
}

function variance(rng: Rng): number {
  return 0.85 + rng.next() * 0.3;
}

function newFighter(cls: CharacterClass, startPotions: number): SimFighter {
  const def = CLASSES.find((c) => c.id === cls)!;
  return {
    class: cls,
    level: 1,
    exp: 0,
    expToNext: 50,
    stats: { ...def.baseStats },
    statPoints: 0,
    potions: startPotions,
  };
}

function asFighterLike(f: SimFighter) {
  return {
    class: f.class,
    stats: f.stats,
    equipment: { weapon: null, armor: null, accessory: null },
  };
}

/** Greedy allocation: everything into the class primary stat. */
function autoAllocate(f: SimFighter): void {
  if (f.statPoints <= 0) return;
  const primary = getPrimaryStatForClass(f.class);
  f.stats[primary] += f.statPoints;
  f.statPoints = 0;
}

function gainExp(f: SimFighter, amount: number): void {
  const classDef = CLASSES.find((c) => c.id === f.class);
  const r = planLevelUps(
    { level: f.level, exp: f.exp, expToNext: f.expToNext, stats: f.stats, statPoints: f.statPoints },
    amount,
    classDef,
  );
  f.level = r.level;
  f.exp = r.exp;
  f.expToNext = r.expToNext;
  f.stats = r.stats;
  f.statPoints = r.statPoints;
  autoAllocate(f);
}

/** Resolve one fight. Returns 'won' or 'died'. Mutates fighter HP/MP/potions. */
function fight(
  f: SimFighter,
  enemyTemplate: Enemy,
  rng: Rng,
  potionHeal: number,
  floor: number,
  expMult: number,
): 'won' | 'died' {
  const classDef = CLASSES.find((c) => c.id === f.class)!;
  const opener = classDef.skills[0];
  let enemyHp = enemyTemplate.stats.hp;
  const like = () => asFighterLike(f);

  for (let round = 0; round < 200; round++) {
    // --- player turn ---
    if (f.stats.mp >= opener.mpCost) {
      const atk = getSkillAttack(f, {});
      const base = Math.max(1, Math.floor((atk * opener.power) / 2) - enemyTemplate.defense * 0.5);
      let dmg = Math.floor(base * variance(rng));
      if (opener.id === 'backstab' && rng.next() < 0.25) dmg *= 2;
      f.stats.mp -= opener.mpCost;
      if (opener.kind === 'healStrike') {
        f.stats.hp = Math.min(f.stats.maxHp, f.stats.hp + 2 * f.stats.int);
      }
      enemyHp -= Math.max(1, dmg);
    } else if (f.stats.hp < f.stats.maxHp * 0.35 && f.potions > 0) {
      f.potions--;
      f.stats.hp = Math.min(f.stats.maxHp, f.stats.hp + potionHeal);
    } else {
      let dmg = rollDamageWithVariance(getPrimaryAttack(like()), enemyTemplate.defense, variance(rng));
      if (rng.next() < critChanceForDex(f.stats.dex)) dmg = Math.floor(dmg * 2);
      enemyHp -= dmg;
    }
    if (enemyHp <= 0) {
      gainExp(f, Math.floor(enemyTemplate.expReward * expMult));
      // Volatile burst answers back — same rule as the live game.
      if (enemyTemplate.onDeath?.kind === 'burst') {
        f.stats.hp -= enemyTemplate.onDeath.flat + enemyTemplate.onDeath.perFloor * floor;
        if (f.stats.hp <= 0) {
          f.stats.hp = 0;
          return 'died';
        }
      }
      return 'won';
    }

    // --- enemy turn (basic attack; dodge applies, no guard in this policy) ---
    if (rng.next() < dodgeChanceForDex(f.stats.dex, enemyTemplate.stats.dex, false)) {
      continue;
    }
    const incoming = rollDamageWithVariance(
      enemyTemplate.attack,
      getPlayerDefTotal(like()),
      variance(rng),
    );
    f.stats.hp -= incoming;
    if (f.stats.hp <= 0) {
      f.stats.hp = 0;
      return 'died';
    }
  }
  return 'died';
}

export function simulateRun(
  cls: CharacterClass,
  runSeed: number,
  maxFloor = 30,
  startPotions = 3,
  potionHeal = 30,
): RunResult {
  const f = newFighter(cls, startPotions);
  const combatRng = mulberry32(seedFromString(`${runSeed}:combat`));

  for (let floor = 1; floor <= maxFloor; floor++) {
    const dungeon = generateDungeon(floor, rngForFloor(runSeed, floor));
    const rooms = dungeon.rooms.flat();
    const expMult = dungeon.modifier === 'swarm' ? 1.25 : 1;
    let shrineUsed = false;

    for (const room of rooms) {
      if (room.type === 'monster' || room.type === 'elite' || room.type === 'boss') {
        if (!room.enemy) continue;
        if (fight(f, room.enemy, combatRng, potionHeal, floor, expMult) === 'died') {
          return { classId: cls, deathFloor: floor, deathCause: 'monster', level: f.level };
        }
      } else if (room.type === 'vault') {
        // No keys in the intended-play sim — the vault stays sealed.
        continue;
      } else if (room.type === 'trap') {
        const dodge = dodgeChanceForDex(f.stats.dex, trapDexForFloor(floor), false);
        if (combatRng.next() >= dodge) {
          f.stats.hp -= room.trapDamage ?? 10;
          if (f.stats.hp <= 0) {
            return { classId: cls, deathFloor: floor, deathCause: 'trap', level: f.level };
          }
        }
      } else if (room.type === 'shrine' && !shrineUsed) {
        shrineUsed = true;
        f.stats.hp = Math.min(f.stats.maxHp, f.stats.hp + Math.floor(f.stats.maxHp * 0.3));
        f.stats.mp = Math.min(f.stats.maxMp, f.stats.mp + Math.floor(f.stats.maxMp * 0.3));
      }
    }
  }
  return { classId: cls, deathFloor: maxFloor, deathCause: 'survived', level: f.level };
}

export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[idx];
}

export interface ClassSummary {
  classId: CharacterClass;
  runs: number;
  median: number;
  p10: number;
  p90: number;
  avgLevel: number;
  trapShare: number;
}

export function summarize(results: RunResult[]): ClassSummary {
  const floors = results.map((r) => r.deathFloor).sort((a, b) => a - b);
  const traps = results.filter((r) => r.deathCause === 'trap').length;
  return {
    classId: results[0]?.classId ?? 'warrior',
    runs: results.length,
    median: percentile(floors, 0.5),
    p10: percentile(floors, 0.1),
    p90: percentile(floors, 0.9),
    avgLevel: results.reduce((a, r) => a + r.level, 0) / Math.max(1, results.length),
    trapShare: results.length === 0 ? 0 : traps / results.length,
  };
}

export function runBalanceSuite(opts: SimOptions = {}): ClassSummary[] {
  const { runsPerClass = 250, baseSeed = 12345, maxFloor = 30, startPotions = 3, potionHeal = 30 } = opts;
  const classes: CharacterClass[] = ['warrior', 'rogue', 'mage', 'cleric'];
  return classes.map((cls) => {
    const results: RunResult[] = [];
    for (let i = 0; i < runsPerClass; i++) {
      results.push(simulateRun(cls, baseSeed + i, maxFloor, startPotions, potionHeal));
    }
    return summarize(results);
  });
}
