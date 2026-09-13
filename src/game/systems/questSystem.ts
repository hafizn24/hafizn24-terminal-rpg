import type { Quest } from '../../types/game';
import { shuffleArray } from '../../utils/rng';


const QUEST_TEMPLATES = [
  {
    name: 'Slime Slayer',
    description: 'Defeat 5 slimes in the dungeon.',
    objective: { type: 'kill' as const, target: 'slime', required: 5 },
    reward: { gold: 50, exp: 30 },
  },
  {
    name: 'Goblin Bane',
    description: 'Defeat 3 goblins.',
    objective: { type: 'kill' as const, target: 'goblin', required: 3 },
    reward: { gold: 75, exp: 45 },
  },
  {
    name: 'Skeleton Breaker',
    description: 'Defeat 4 skeletons.',
    objective: { type: 'kill' as const, target: 'skeleton', required: 4 },
    reward: { gold: 100, exp: 60 },
  },
  {
    name: 'Floor Climber',
    description: 'Reach floor 3 of the dungeon.',
    objective: { type: 'floor' as const, target: 'any', required: 3 },
    reward: { gold: 80, exp: 50 },
  },
  {
    name: 'Deep Diver',
    description: 'Reach floor 5 of the dungeon.',
    objective: { type: 'floor' as const, target: 'any', required: 5 },
    reward: { gold: 150, exp: 100 },
  },
  {
    name: 'Gold Hoarder',
    description: 'Accumulate 200 gold.',
    objective: { type: 'gold' as const, target: 'any', required: 200 },
    reward: { gold: 100, exp: 40 },
  },
  {
    name: 'Monster Hunter',
    description: 'Defeat 10 enemies of any type.',
    objective: { type: 'kill' as const, target: 'any', required: 10 },
    reward: { gold: 120, exp: 80 },
  },
  {
    name: 'Orc Slayer',
    description: 'Defeat 3 orc warriors.',
    objective: { type: 'kill' as const, target: 'orc', required: 3 },
    reward: { gold: 130, exp: 75 },
  },
  {
    name: 'Dark Menace',
    description: 'Defeat 3 dark mages.',
    objective: { type: 'kill' as const, target: 'dark_mage', required: 3 },
    reward: { gold: 140, exp: 90 },
  },
  {
    name: 'Wealthy Adventurer',
    description: 'Accumulate 500 gold.',
    objective: { type: 'gold' as const, target: 'any', required: 500 },
    reward: { gold: 200, exp: 120 },
  },
  {
    name: 'Dragon Slayer',
    description: 'Defeat 2 dragon wyrmlings.',
    objective: { type: 'kill' as const, target: 'dragon_wyrmling', required: 2 },
    reward: { gold: 250, exp: 150, itemId: 'steel_sword' },
  },
  {
    name: 'Undead Purifier',
    description: 'Defeat 5 skeletons.',
    objective: { type: 'kill' as const, target: 'skeleton', required: 5 },
    reward: { gold: 110, exp: 70 },
  },
];

export function generateDailyQuests(date = new Date()): Quest[] {
  const shuffled = shuffleArray(QUEST_TEMPLATES);
  const day = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  return shuffled.slice(0, 3).map((template) => ({
    id: `daily_${day}_${template.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
    name: template.name,
    description: template.description,
    type: 'daily' as const,
    objective: { ...template.objective },
    progress: 0,
    reward: { ...template.reward },
    completed: false,
  }));
}

export function generateSideQuests(_floor: number): Quest[] {
  const shuffled = shuffleArray(QUEST_TEMPLATES);
  return shuffled.slice(0, 2).map((template) => ({
    id: `side_${template.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
    name: template.name,
    description: template.description,
    type: 'side' as const,
    objective: { ...template.objective },
    progress: 0,
    reward: { ...template.reward },
    completed: false,
  }));
}

export function checkQuestProgress(quest: Quest, eventType: string, target: string): boolean {
  if (quest.completed) return false;
  if (quest.objective.type !== eventType) return false;
  if (quest.objective.type === 'kill') {
    return quest.objective.target === 'any' || quest.objective.target === target;
  }
  if (quest.objective.type === 'collect') {
    return quest.objective.target === 'any' || quest.objective.target === target;
  }
  // 'floor' and 'gold' events carry the absolute value (floor/gold amount);
  // the store sets progress from that value, so any matching event counts.
  return true;
}

export function isQuestComplete(quest: Quest): boolean {
  return quest.progress >= quest.objective.required;
}

export function checkDailyReset(lastReset: string): boolean {
  if (!lastReset) return true;
  const last = new Date(lastReset);
  const now = new Date();
  return last.getDate() !== now.getDate() ||
    last.getMonth() !== now.getMonth() ||
    last.getFullYear() !== now.getFullYear();
}
