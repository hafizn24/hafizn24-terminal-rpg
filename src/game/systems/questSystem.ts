import type { Quest } from '../../types/game';


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
    description: 'Defeat 2 goblin kings.',
    objective: { type: 'kill' as const, target: 'goblin_king', required: 2 },
    reward: { gold: 250, exp: 150, itemId: 'steel_sword' },
  },
  {
    name: 'Undead Purifier',
    description: 'Defeat 5 skeletons.',
    objective: { type: 'kill' as const, target: 'skeleton', required: 5 },
    reward: { gold: 110, exp: 70 },
  },
];

export function generateDailyQuests(): Quest[] {
  const shuffled = [...QUEST_TEMPLATES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3).map((template, i) => ({
    id: `daily_${Date.now()}_${i}`,
    name: template.name,
    description: template.description,
    type: 'daily' as const,
    objective: { ...template.objective },
    progress: 0,
    reward: { ...template.reward },
    completed: false,
  }));
}

export function generateSideQuests(floor: number): Quest[] {
  const available = QUEST_TEMPLATES.filter((t) => {
    if (t.objective.type === 'floor') return t.objective.required >= floor;
    return true;
  });
  const shuffled = available.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 2).map((template, i) => ({
    id: `side_${Date.now()}_${i}`,
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
  return false;
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
