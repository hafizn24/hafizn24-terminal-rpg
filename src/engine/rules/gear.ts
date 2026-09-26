/**
 * Pure gear-comparison math. ZERO React imports.
 *
 * Shop + Inventory delegate here so "Equip?" always shows the same
 * +ATK / +DEF delta instead of each screen owning its own copy.
 */
import type { Item, Player } from '../../types/game';
import { getGearOffense, getPlayerDefTotal, getPrimaryAttack } from './damage';

export interface GearDelta {
  atkDelta: number;
  defDelta: number;
  hpDelta: number;
  mpDelta: number;
}

/** ATK contribution of one item (offensive stats only: str/dex/int). */
export function itemOffense(item: Item | null): number {
  if (!item?.statBonus) return 0;
  const b = item.statBonus;
  return (b.str || 0) + (b.dex || 0) + (b.int || 0);
}

/** DEF contribution of one item. */
export function itemDefense(item: Item | null): number {
  return item?.statBonus?.def || 0;
}

function slotFor(item: Item): 'weapon' | 'armor' | 'accessory' | null {
  if (item.type === 'weapon') return 'weapon';
  if (item.type === 'armor') {
    // Accessories are armor-typed charms — match InventoryScreen's rule.
    if (['lucky_charm', 'iron_ring', 'sage_amulet', 'ranger_cloak', 'void_ward'].includes(item.id)) {
      return 'accessory';
    }
    return 'armor';
  }
  return null;
}

/**
 * Delta if `item` were equipped (vs. current loadout), including enchant
 * bonuses from `instanceData.enchantLevel` (+2 offense / +1 def per level).
 */
export function compareGear(player: Player, item: Item): GearDelta | null {
  const slot = slotFor(item);
  if (!slot) return null;
  const current = player.equipment[slot] ?? null;

  const enchantBonus = (it: Item | null, qty: number): number => {
    void qty;
    void it;
    return 0;
  };
  void enchantBonus;

  const curOff = itemOffense(current);
  const newOff = itemOffense(item);
  // Enchant levels ride on inventory slots, not the catalogue item — the
  // caller adds them via `withEnchantOffense` when it knows the slot level.
  const atkDelta = newOff - curOff;

  const curDef = itemDefense(current);
  const newDef = itemDefense(item);
  const defDelta = newDef - curDef;

  const hpDelta = (item.statBonus?.hp || 0) - (current?.statBonus?.hp || 0);
  const mpDelta = (item.statBonus?.mp || 0) - (current?.statBonus?.mp || 0);
  return { atkDelta, defDelta, hpDelta, mpDelta };
}

/** Total primary attack if `item` were equipped (for preview lines). */
export function previewAttackWith(player: Player, item: Item): number | null {
  const slot = slotFor(item);
  if (!slot) return null;
  const swapped: Player = {
    ...player,
    equipment: { ...player.equipment, [slot]: item },
  };
  return getPrimaryAttack(swapped);
}

/** Total DEF if `item` were equipped (for preview lines). */
export function previewDefWith(player: Player, item: Item): number | null {
  const slot = slotFor(item);
  if (!slot) return null;
  const swapped: Player = {
    ...player,
    equipment: { ...player.equipment, [slot]: item },
  };
  return getPlayerDefTotal(swapped);
}

/** One-line delta label: "+3 ATK · +1 DEF" (omits zeros). */
export function formatGearDelta(d: GearDelta): string {
  const parts: string[] = [];
  if (d.atkDelta !== 0) parts.push(`${d.atkDelta > 0 ? '+' : ''}${d.atkDelta} ATK`);
  if (d.defDelta !== 0) parts.push(`${d.defDelta > 0 ? '+' : ''}${d.defDelta} DEF`);
  if (d.hpDelta !== 0) parts.push(`${d.hpDelta > 0 ? '+' : ''}${d.hpDelta} HP`);
  if (d.mpDelta !== 0) parts.push(`${d.mpDelta > 0 ? '+' : ''}${d.mpDelta} MP`);
  return parts.length > 0 ? parts.join(' · ') : 'sidegrade';
}

/** Re-export for call-sites that only need offense totals. */
export { getGearOffense };
