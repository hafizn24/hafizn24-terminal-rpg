/**
 * Relic catalogue — Slay-the-Spire-style boons drafted after each boss.
 * Small content set, build variety: each relic bends one rule.
 */

export interface RelicDefinition {
  id: string;
  name: string;
  description: string;
}

export const RELICS: RelicDefinition[] = [
  { id: 'blood_vial', name: 'Blood Vial', description: 'Heal 8 HP after every victory.' },
  { id: 'feather_charm', name: 'Feather Charm', description: '+8% dodge chance.' },
  { id: 'whetstone', name: 'Whetstone', description: '+20% basic attack damage.' },
  { id: 'ward_charm', name: 'Ward Charm', description: 'Traps deal half damage.' },
  { id: 'focus_crystal', name: 'Focus Crystal', description: 'Skills cost 3 less MP (min 1).' },
  { id: 'lucky_coin', name: 'Lucky Coin', description: '+25% gold from victories.' },
  { id: 'iron_hide', name: 'Iron Hide', description: '+4 defense.' },
  { id: 'adrenaline', name: 'Adrenaline', description: '+25% skill damage while below 30% HP.' },
];

export function getRelic(id: string): RelicDefinition | undefined {
  return RELICS.find((r) => r.id === id);
}
