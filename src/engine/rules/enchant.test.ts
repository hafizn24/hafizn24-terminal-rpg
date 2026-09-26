import { describe, expect, it } from 'vitest';
import {
  MAX_ENCHANT_LEVEL,
  canEnchantType,
  enchantCost,
  enchantDefenseBonus,
  enchantOffenseBonus,
  getEnchantLevel,
  totalEnchantCost,
} from './enchant';

describe('enchant rules', () => {
  it('costs 100 * 2^level', () => {
    expect(enchantCost(0)).toBe(100);
    expect(enchantCost(1)).toBe(200);
    expect(enchantCost(4)).toBe(1600);
    expect(enchantCost(5)).toBe(Infinity);
    expect(totalEnchantCost(5)).toBe(3100);
  });

  it('caps at +5', () => {
    expect(MAX_ENCHANT_LEVEL).toBe(5);
    expect(enchantOffenseBonus(5)).toBe(10);
    expect(enchantDefenseBonus(5)).toBe(5);
    expect(enchantOffenseBonus(99)).toBe(10);
  });

  it('reads instanceData safely', () => {
    expect(getEnchantLevel(undefined)).toBe(0);
    expect(getEnchantLevel({})).toBe(0);
    expect(getEnchantLevel({ enchantLevel: 3 })).toBe(3);
    expect(getEnchantLevel({ enchantLevel: 99 })).toBe(5);
  });

  it('only enchants gear', () => {
    expect(canEnchantType('weapon')).toBe(true);
    expect(canEnchantType('armor')).toBe(true);
    expect(canEnchantType('potion')).toBe(false);
    expect(canEnchantType('key')).toBe(false);
  });
});
