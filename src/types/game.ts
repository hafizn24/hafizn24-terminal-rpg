export type CharacterClass = 'warrior' | 'mage' | 'rogue' | 'cleric';

export type Screen =
  | 'title'
  | 'classSelect'
  | 'nameInput'
  | 'town'
  | 'dungeon'
  | 'combat'
  | 'inventory'
  | 'gameOver'
  | 'shop'
  | 'questBoard';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic';

export type ItemType = 'weapon' | 'armor' | 'potion' | 'key' | 'misc';

export type RoomType =
  | 'empty'
  | 'monster'
  | 'treasure'
  | 'trap'
  | 'shop'
  | 'stairs'
  | 'boss'
  | 'start';

export type StatType = 'str' | 'dex' | 'int' | 'hp' | 'mp';

export interface Stats {
  str: number;
  dex: number;
  int: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
}

export interface ClassDefinition {
  id: CharacterClass;
  name: string;
  description: string;
  ascii: string;
  baseStats: Stats;
  growth: Record<StatType, number>;
  skill: {
    name: string;
    description: string;
    mpCost: number;
    power: number;
  };
}

export interface Item {
  id: string;
  name: string;
  type: ItemType;
  rarity: Rarity;
  description: string;
  price: number;
  statBonus?: Partial<Record<StatType, number>>;
  healAmount?: number;
  mpRestoreAmount?: number;
  ascii?: string;
}

export interface Equipment {
  weapon: Item | null;
  armor: Item | null;
  accessory: Item | null;
}

export interface InventorySlot {
  item: Item;
  quantity: number;
}

export interface Player {
  name: string;
  class: CharacterClass;
  level: number;
  exp: number;
  expToNext: number;
  stats: Stats;
  gold: number;
  inventory: InventorySlot[];
  equipment: Equipment;
  floor: number;
}

export interface Enemy {
  id: string;
  name: string;
  ascii: string;
  stats: Stats;
  attack: number;
  defense: number;
  expReward: number;
  goldReward: number;
  lootTable: LootEntry[];
  skills: EnemySkill[];
}

export interface EnemySkill {
  name: string;
  power: number;
  chance: number;
}

export interface LootEntry {
  itemId: string;
  chance: number;
  quantity: number;
}

export interface Room {
  type: RoomType;
  explored: boolean;
  x: number;
  y: number;
  connected: number[];
  enemy?: Enemy;
  item?: Item;
  trapDamage?: number;
  shopItems?: Item[];
}

export interface DungeonState {
  floor: number;
  rooms: Room[][];
  playerPos: { x: number; y: number };
  gridSize: number;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'side';
  objective: {
    type: 'kill' | 'floor' | 'gold' | 'collect';
    target: string;
    required: number;
  };
  progress: number;
  reward: {
    gold: number;
    exp: number;
    itemId?: string;
  };
  completed: boolean;
}

export interface GameState {
  currentScreen: Screen;
  player: Player | null;
  dungeon: DungeonState | null;
  quests: Quest[];
  gameOverMessage: string;
  lastSave: string;
}

export interface LogMessage {
  id: number;
  text: string;
  type: 'info' | 'combat' | 'loot' | 'danger' | 'system';
  timestamp: number;
}
