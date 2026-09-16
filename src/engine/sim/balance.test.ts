import { describe, expect, it } from 'vitest';
import { CLASSES } from '../../game/data/classes';
import {
  critChanceForDex,
  dodgeChanceForDex,
  getPrimaryAttack,
  getPrimaryStatForClass,
  getSkillAttack,
  intentPreviewRange,
  rollDamageWithVariance,
} from '../rules/damage';
import { applyStatPointToStats, calcExpForLevel, planLevelUps } from '../rules/progression';
import { effectiveSkillCost, getRelicMods, unlockedSkills } from '../rules/relics';
import { getDailySeedForKey, mulberry32, rngForFloor, seedFromString } from '../rng';
import {
  FINAL_FLOOR,
  allReachable,
  generateDungeon,
  getBossForFloor,
  getEnemiesForFloor,
  gridSizeForFloor,
} from '../../game/systems/dungeonGenerator';
import { runBalanceSuite } from './autoplay';

const like = (cls: string, stats = { str: 10, dex: 10, int: 10 }) => ({
  class: cls,
  stats,
  equipment: { weapon: null, accessory: null },
});

describe('damage rules', () => {
  it('scales basic attack off the class primary stat', () => {
    expect(getPrimaryStatForClass('warrior')).toBe('str');
    expect(getPrimaryStatForClass('rogue')).toBe('dex');
    expect(getPrimaryStatForClass('mage')).toBe('int');
    expect(getPrimaryStatForClass('cleric')).toBe('int');
    // A mage with 0 STR still hits via INT (the old STR-only formula returned ~6).
    expect(getPrimaryAttack(like('mage', { str: 0, dex: 8, int: 16 }))).toBe(16);
    expect(getPrimaryAttack(like('warrior', { str: 14, dex: 10, int: 6 }))).toBe(14);
  });

  it('counts offensive gear for basic + skill attacks', () => {
    const geared = {
      class: 'mage',
      stats: { str: 6, dex: 8, int: 16 },
      equipment: { weapon: { statBonus: { int: 6 } }, accessory: null },
    };
    expect(getPrimaryAttack(geared)).toBe(22);
    expect(getSkillAttack(geared, { int: 6 })).toBeGreaterThan(getSkillAttack(like('mage'), {}));
  });

  it('floors damage at 1 and applies variance explicitly', () => {
    expect(rollDamageWithVariance(3, 99, 1.0)).toBe(1);
    expect(rollDamageWithVariance(20, 4, 1.0)).toBe(18);
    expect(rollDamageWithVariance(20, 4, 0.85)).toBe(Math.floor(18 * 0.85));
  });

  it('caps crit and dodge', () => {
    expect(critChanceForDex(999)).toBe(0.4);
    expect(dodgeChanceForDex(999, 0)).toBe(0.3);
    expect(dodgeChanceForDex(0, 999)).toBe(0);
  });

  it('previews intent ranges matching the fight formula', () => {
    expect(intentPreviewRange(100, 10)).toEqual({ min: Math.floor(95 * 0.85), max: Math.floor(95 * 1.15) });
  });
});

describe('progression rules', () => {
  it('chains multi-level-ups in one kill', () => {
    const mage = CLASSES.find((c) => c.id === 'mage')!;
    const r = planLevelUps(
      { level: 1, exp: 0, expToNext: 50, stats: { ...mage.baseStats }, statPoints: 0 },
      500,
      mage,
    );
    expect(r.level).toBeGreaterThan(2);
    expect(r.messages).toHaveLength(r.level - 1);
    // Level-ups refill to the NEW maximums.
    expect(r.stats.hp).toBe(r.stats.maxHp);
    expect(r.stats.def).toBe(mage.baseStats.def + mage.growth.def * (r.level - 1));
  });

  it('allocates every stat type, including def', () => {
    const mage = CLASSES.find((c) => c.id === 'mage')!;
    const base = { ...mage.baseStats };
    expect(applyStatPointToStats(base, 'def').stats.def).toBe(base.def + 1);
    expect(applyStatPointToStats(base, 'hp').stats.maxHp).toBe(base.maxHp + 10);
    expect(applyStatPointToStats(base, 'nope' as never).spent).toBe(false);
  });

  it('keeps the exp curve monotonic', () => {
    expect(calcExpForLevel(2)).toBeGreaterThan(calcExpForLevel(1));
    expect(calcExpForLevel(10)).toBeGreaterThan(calcExpForLevel(9));
  });
});

describe('seeded rng + generation', () => {
  it('is stable for the same seed and distinct across seeds', () => {
    expect(seedFromString('a')).toBe(seedFromString('a'));
    expect(seedFromString('a')).not.toBe(seedFromString('b'));
    const a = mulberry32(42);
    const b = mulberry32(42);
    expect([a.next(), a.next()]).toEqual([b.next(), b.next()]);
  });

  it('shares the daily seed per key', () => {
    expect(getDailySeedForKey('2026-09-16')).toBe(getDailySeedForKey('2026-09-16'));
    expect(getDailySeedForKey('2026-09-16')).not.toBe(getDailySeedForKey('2026-09-17'));
  });

  it('generates identical floors for identical seeds', () => {
    const snapshot = (floor: number, seed: number) =>
      JSON.stringify(generateDungeon(floor, rngForFloor(seed, floor)).rooms.map((row) => row.map((r) => r.type)));
    expect(snapshot(3, 777)).toBe(snapshot(3, 777));
    expect(snapshot(3, 777)).not.toBe(snapshot(3, 778));
  });

  it('caps traps at 2 per floor across seeds', () => {
    for (let seed = 1; seed <= 50; seed++) {
      for (const floor of [1, 5, 10, 20]) {
        const traps = generateDungeon(floor, rngForFloor(seed, floor)).rooms
          .flat()
          .filter((r) => r.type === 'trap').length;
        expect(traps).toBeLessThanOrEqual(2);
      }
    }
  });
});

describe('class skills', () => {
  it('gives every class 3 skills unlocked at 1/4/8', () => {
    for (const cls of CLASSES) {
      expect(cls.skills).toHaveLength(3);
      expect(unlockedSkills(cls.skills, 1)).toHaveLength(1);
      expect(unlockedSkills(cls.skills, 4)).toHaveLength(2);
      expect(unlockedSkills(cls.skills, 8)).toHaveLength(3);
      expect(unlockedSkills(cls.skills, 30)).toHaveLength(3);
    }
  });

  it('gives each class a distinct role beyond damage', () => {
    const kinds = (id: string) => CLASSES.find((c) => c.id === id)!.skills.map((s) => s.kind);
    expect(kinds('warrior')).toContain('rage');
    expect(kinds('warrior')).toContain('shield');
    expect(kinds('mage')).toContain('weaken');
    expect(kinds('rogue')).toContain('critNext');
    expect(kinds('rogue')).toContain('evade');
    expect(kinds('cleric')).toContain('cleanse');
    expect(kinds('cleric')).toContain('shield');
  });
});

describe('relics', () => {
  it('folds mods purely and ignores unknown ids', () => {
    expect(getRelicMods([])).toEqual(getRelicMods(['not_a_relic']));
    const mods = getRelicMods(['whetstone', 'lucky_coin', 'focus_crystal', 'iron_hide']);
    expect(mods.basicMult).toBeCloseTo(1.2);
    expect(mods.goldMult).toBeCloseTo(1.25);
    expect(mods.defBonus).toBe(4);
    expect(effectiveSkillCost(10, mods)).toBe(7);
    expect(effectiveSkillCost(2, mods)).toBe(1);
    const warded = getRelicMods(['ward_charm']);
    expect(warded.trapMult).toBe(0.5);
  });
});

describe('dungeon generation', () => {
  it('grows the grid with depth', () => {
    expect(gridSizeForFloor(1)).toBe(5);
    expect(gridSizeForFloor(10)).toBe(5);
    expect(gridSizeForFloor(11)).toBe(6);
    expect(gridSizeForFloor(20)).toBe(6);
    expect(gridSizeForFloor(21)).toBe(7);
    expect(gridSizeForFloor(30)).toBe(7);
  });

  it('retires low tiers and never empties the pool', () => {
    const early = getEnemiesForFloor(1).map((e) => e.id);
    expect(early).toContain('slime');
    const late = getEnemiesForFloor(25).map((e) => e.id);
    expect(late).not.toContain('slime');
    expect(late).not.toContain('goblin');
    for (let floor = 1; floor <= 40; floor++) {
      expect(getEnemiesForFloor(floor).length).toBeGreaterThan(0);
    }
  });

  it('maps one exact boss per tier (monotonic spine)', () => {
    expect(getBossForFloor(5).id).toBe('goblin_king');
    expect(getBossForFloor(10).id).toBe('necromancer');
    expect(getBossForFloor(15).id).toBe('flame_tyrant');
    expect(getBossForFloor(20).id).toBe('dragon_lord');
    expect(getBossForFloor(25).id).toBe('void_reaver');
    expect(getBossForFloor(30).id).toBe('demon_king');
    expect(FINAL_FLOOR).toBe(30);
  });

  it('keeps stairs and bosses reachable through the walls', () => {
    for (let seed = 1; seed <= 30; seed++) {
      for (const floor of [1, 5, 11, 15, 21, 30]) {
        const d = generateDungeon(floor, rngForFloor(seed, floor));
        expect(d.gridSize).toBe(gridSizeForFloor(floor));
        const targets = [{ x: d.gridSize - 1, y: d.gridSize - 1 }];
        if (floor % 5 === 0) targets.push({ x: d.gridSize - 1, y: d.gridSize - 2 });
        expect(allReachable(d.rooms, d.gridSize, targets)).toBe(true);
      }
    }
  });

  it('places at most one vault (floor 3+) with rare+ loot, and keys exist', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const early = generateDungeon(1, rngForFloor(seed, 1));
      expect(early.rooms.flat().filter((r) => r.type === 'vault')).toHaveLength(0);
      const mid = generateDungeon(8, rngForFloor(seed, 8));
      const vaults = mid.rooms.flat().filter((r) => r.type === 'vault');
      expect(vaults.length).toBeLessThanOrEqual(1);
      for (const v of vaults) {
        expect(['rare', 'epic']).toContain(v.item?.rarity);
      }
    }
  });

  it('cursed floors have no shrine; every modifier appears', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      const d = generateDungeon(7, rngForFloor(seed, 7));
      seen.add(d.modifier);
      if (d.modifier === 'cursed') {
        expect(d.rooms.flat().filter((r) => r.type === 'shrine')).toHaveLength(0);
      }
    }
    expect(seen).toEqual(new Set(['none', 'golden', 'cursed', 'swarm']));
  });
});

describe('balance suite', () => {
  it('keeps median clear floors inside the target band and traps a minority of deaths', () => {
    // 1,000 seeded auto-play runs (250/class). Measured 2026-09-16 (Phase 3):
    // all classes median 5, trap share 10-14%.
    // Bands have slack for future tuning, but any Phase-1 regression
    // (mage STR-only, ~40% trap tax) fails loudly.
    const summaries = runBalanceSuite({ runsPerClass: 250, baseSeed: 20260916 });
    for (const s of summaries) {
      expect(s.median, `${s.classId} median`).toBeGreaterThanOrEqual(4);
      expect(s.median, `${s.classId} median`).toBeLessThanOrEqual(10);
      expect(s.trapShare, `${s.classId} trap share`).toBeLessThan(0.35);
    }
  }, 120000);
});
