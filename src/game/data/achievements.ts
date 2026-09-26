/**
 * Achievement catalogue — local-only, earned through play.
 * No backend, no pay-to-win: pure collection + bragging rights.
 */

export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  /** Hint shown when locked. */
  hint: string;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: 'first_blood', name: 'First Blood', description: 'Win your first combat.', hint: 'Win any fight.' },
  { id: 'elite_hunter', name: 'Elite Hunter', description: 'Slay an elite.', hint: 'Look for ◈ tiles.' },
  { id: 'boss_slayer', name: 'Boss Slayer', description: 'Slay any boss.', hint: 'Survive floor 5.' },
  { id: 'vault_raider', name: 'Vault Raider', description: 'Open a sealed vault.', hint: 'Bring a dungeon key.' },
  { id: 'deep_10', name: 'Delver', description: 'Reach floor 10.', hint: 'Keep descending.' },
  { id: 'deep_20', name: 'Spelunker', description: 'Reach floor 20.', hint: 'Keep descending.' },
  { id: 'deep_30', name: 'Kingslayer', description: 'Slay the Demon King.', hint: 'Finish floor 30.' },
  { id: 'endless', name: 'Sealbreaker', description: 'Enter endless descent (31+).', hint: 'Break the seal.' },
  { id: 'flawless_boss', name: 'Flawless', description: 'Beat a boss at full HP.', hint: 'Enter the ▲ at full HP.' },
  { id: 'relic_collector', name: 'Relic Collector', description: 'Hold 3 relics at once.', hint: 'Draft after bosses.' },
  { id: 'enchanter', name: 'Enchanter', description: 'Enchant any gear at the Smithy.', hint: 'Visit the Smithy.' },
  { id: 'bestiary_10', name: 'Naturalist', description: 'Unlock 10 Bestiary entries.', hint: 'Kill everything once.' },
];

export function getAchievement(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id);
}
