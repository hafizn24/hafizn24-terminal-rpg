export type CharacterClass = 'warrior' | 'mage' | 'rogue' | 'cleric';

export type Screen =
  | 'title'
  | 'classSelect'
  | 'town'
  | 'dungeon'
  | 'combat'
  | 'inventory'
  | 'stats'
  | 'gameOver'
  | 'shop'
  | 'questBoard'
  | 'meta'
  | 'bestiary'
  | 'relicDraft'
  | 'ending';

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
  | 'elite'
  | 'shrine'
  | 'start'
  | 'wall'
  | 'vault';

/** One rolled floor modifier — variance per line of code. Shown in the header. */
export type FloorModifier = 'none' | 'golden' | 'cursed' | 'swarm';

/** Combat skill roles: damage vs. setup/payoff utility (never just a bigger number). */
export type SkillKind =
  | 'strike'
  | 'nuke'
  | 'healStrike'
  | 'rage'
  | 'shield'
  | 'weaken'
  | 'critNext'
  | 'evade'
  | 'cleanse';

export type StatType = 'str' | 'dex' | 'int' | 'hp' | 'mp' | 'def';

export interface Stats {
  str: number;
  dex: number;
  int: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  /** Flat damage reduction pool. Reduces incoming damage via calcDamage (def * 0.5). */
  def: number;
}

export interface ClassSkill {
  id: string;
  name: string;
  description: string;
  mpCost: number;
  /** Damage multiplier for strikes/nukes, effect magnitude otherwise (see kind). */
  power: number;
  unlockLevel: number;
  kind: SkillKind;
}

export interface ClassDefinition {
  id: CharacterClass;
  name: string;
  description: string;
  ascii: string;
  baseStats: Stats;
  growth: Record<StatType, number>;
  /** Three skills per class, unlocked at levels 1 / 4 / 8. skills[0] is the opener. */
  skills: ClassSkill[];
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
  effect?: 'bomb' | 'smoke';
  effectPower?: number;
  /** Removes burn/poison when used (the only cleanse outside the Cleric). */
  cleanse?: boolean;
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
  /** Per-instance state (enchants, affixes) — round-trips through the save. */
  instanceData?: Record<string, number>;
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
  /** Unspent level-up points the player can distribute to STR/DEX/INT/HP/MP. */
  statPoints: number;
  /** Boss-draft boons held for this run (relic ids). */
  relics: string[];
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
  isElite?: boolean;
  /** First floor this enemy can appear. */
  minFloor: number;
  /** Last floor it appears — old tiers retire so descent feels new. */
  maxFloor?: number;
  /** On-death effect (volatile slime burst). Damage = flat + perFloor * floor. */
  onDeath?: {
    kind: 'burst';
    flat: number;
    perFloor: number;
  };
}

export interface EnemySkill {
  name: string;
  power: number;
  chance: number;
  status?: {
    id: 'burn' | 'poison';
    dmg: number;
    turns: number;
  };
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
  enemy?: Enemy;
  item?: Item;
  trapDamage?: number;
  shopItems?: Item[];
}

export interface DungeonState {
  floor: number;
  rooms: Room[][];
  playerPos: { x: number; y: number };
  /** Grows with depth: 5 (floors 1-10), 6 (11-20), 7 (21+). */
  gridSize: number;
  modifier: FloorModifier;
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'side';
  objective: {
    type: 'kill' | 'floor' | 'gold';
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

export interface GameStats {
  bestFloor: number;
  bossesKilled: number;
  runsStarted: number;
}

/** Per-run telemetry, reset on create/load. Powers the death summary screen. */
export interface RunStats {
  kills: number;
  damageDealt: number;
  biggestHit: number;
  goldEarned: number;
  floorsClimbed: number;
  bossesKilled: number;
  startedAt: string;
}

/** Frozen at death: what the Run Summary screen renders. */
export interface RunSummary extends RunStats {
  floorReached: number;
  level: number;
  classId: string;
  shardsEarned: number;
  isDaily: boolean;
}

/** Persistent cross-run meta state (separate localStorage key — survives newGame). */
export interface MetaState {
  shards: number;
  upgrades: Record<string, number>;
  /** Enemy id -> lifetime kills. Unlocks Bestiary entries. */
  kills: Record<string, number>;
  /** Set by beating floor 30. Unlocks endless descent past the seal. */
  endlessUnlocked: boolean;
}

export interface DailyEntry {
  name: string;
  classId: string;
  floor: number;
  bosses: number;
  ts: number;
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
