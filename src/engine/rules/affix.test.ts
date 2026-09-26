import { describe, expect, it } from 'vitest';
import { applyAffix, getDailyModifier, rollAffix } from '../../game/systems/dungeonGenerator';
import { ENEMIES } from '../../game/data/enemies';
import { getRelicMods } from './relics';

describe('endless affixes', () => {
  it('is none before floor 31', () => {
    expect(rollAffix(30, 0.1)).toBe('none');
    expect(rollAffix(1, 0.1)).toBe('none');
  });

  it('rotates bands past the seal', () => {
    // Band 0 (31-35): vampiric or none
    expect(['vampiric', 'none']).toContain(rollAffix(31, 0.1));
    // Band 1 (36-40): arcane or none
    expect(['arcane', 'none']).toContain(rollAffix(36, 0.1));
    // Band 2 (41-45): ironclad or none
    expect(['ironclad', 'none']).toContain(rollAffix(41, 0.1));
  });

  it('buffs enemies per affix', () => {
    const base = ENEMIES.find((e) => e.id === 'orc') ?? ENEMIES[0];
    expect(applyAffix(base, 'none')).toBe(base);
    expect(applyAffix(base, 'vampiric').stats.hp).toBeGreaterThan(base.stats.hp);
    expect(applyAffix(base, 'arcane').attack).toBeGreaterThan(base.attack);
    expect(applyAffix(base, 'ironclad').defense).toBeGreaterThan(base.defense);
  });
});

describe('daily modifier', () => {
  it('is deterministic per key', () => {
    expect(getDailyModifier('2026-09-26')).toBe(getDailyModifier('2026-09-26'));
  });

  it('returns a valid modifier or null', () => {
    for (const day of ['2026-01-01', '2026-06-15', '2026-12-31']) {
      expect(['swarm', 'golden', 'cursed', null]).toContain(getDailyModifier(day));
    }
  });
});

describe('new relics', () => {
  it('folds the 4 new relics', () => {
    const mods = getRelicMods(['vampiric_fang', 'phoenix_feather', 'sage_stone', 'titan_plate']);
    expect(mods.healOnKill).toBeGreaterThanOrEqual(9);
    expect(mods.defBonus).toBeGreaterThanOrEqual(6);
    expect(mods.skillMult).toBeCloseTo(1.1);
    expect(mods.trapMult).toBeLessThan(1);
  });
});
