import { describe, expect, it } from 'vitest';
import { compareGear, formatGearDelta, previewAttackWith, previewDefWith } from './gear';
import { ITEMS } from '../../game/data/items';
import type { Player } from '../../types/game';

function dummyPlayer(): Player {
  return {
    name: 'Test',
    class: 'warrior',
    level: 1,
    exp: 0,
    expToNext: 50,
    stats: { str: 14, dex: 10, int: 6, hp: 120, maxHp: 120, mp: 30, maxMp: 30, def: 5 },
    gold: 100,
    inventory: [],
    equipment: { weapon: ITEMS['rusty_sword'], armor: null, accessory: null },
    floor: 1,
    statPoints: 0,
    relics: [],
  };
}

describe('gear compare', () => {
  it('shows positive delta for upgrades', () => {
    const p = dummyPlayer();
    const d = compareGear(p, ITEMS['iron_sword'])!;
    expect(d.atkDelta).toBeGreaterThan(0);
    expect(formatGearDelta(d)).toContain('ATK');
  });

  it('returns sidegrade for equal gear', () => {
    const p = dummyPlayer();
    const d = compareGear(p, ITEMS['rusty_sword'])!;
    expect(formatGearDelta(d)).toBe('sidegrade');
  });

  it('returns null for non-gear', () => {
    const p = dummyPlayer();
    expect(compareGear(p, ITEMS['hp_potion_s'])).toBeNull();
    expect(previewAttackWith(p, ITEMS['hp_potion_s'])).toBeNull();
    expect(previewDefWith(p, ITEMS['hp_potion_s'])).toBeNull();
  });

  it('previews attack/def totals', () => {
    const p = dummyPlayer();
    expect(previewAttackWith(p, ITEMS['iron_sword'])).toBeGreaterThan(
      previewAttackWith(p, ITEMS['rusty_sword'])!,
    );
  });
});
