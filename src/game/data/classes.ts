import type { ClassDefinition } from '../../types/game';

export const CLASSES: ClassDefinition[] = [
  {
    id: 'warrior',
    name: 'Warrior',
    description: 'A mighty fighter with high HP and strength. Excels in close combat.',
    ascii: `
    +---+
    ¦ ? ¦
    ¦+-+¦
    ¦¦¦¦¦
    +---+
     /¦\\
    +---+
    ¦ ? ¦
    +---+`,
    baseStats: {
      str: 14,
      dex: 10,
      int: 6,
      hp: 120,
      maxHp: 120,
      mp: 30,
      maxMp: 30,
    },
    growth: { str: 3, dex: 1, int: 0, hp: 15, mp: 2 },
    skill: {
      name: 'Power Strike',
      description: 'A devastating blow dealing 2.5x damage.',
      mpCost: 10,
      power: 2.5,
    },
  },
  {
    id: 'mage',
    name: 'Mage',
    description: 'A wielder of arcane arts. High INT and MP for powerful spells.',
    ascii: `
    +---+
    ¦ ? ¦
    ¦+-+¦
    ¦¦¦¦¦
    +---+
     /¦\\
    +---+
    ¦ ??¦
    +---+`,
    baseStats: {
      str: 6,
      dex: 8,
      int: 16,
      hp: 80,
      maxHp: 80,
      mp: 80,
      maxMp: 80,
    },
    growth: { str: 0, dex: 1, int: 3, hp: 8, mp: 8 },
    skill: {
      name: 'Fireball',
      description: 'Hurls a fiery blast dealing 3x INT-based damage.',
      mpCost: 15,
      power: 3.0,
    },
  },
  {
    id: 'rogue',
    name: 'Rogue',
    description: 'A swift shadow with high DEX. Lands critical hits frequently.',
    ascii: `
    +---+
    ¦ ? ¦
    ¦+-+¦
    ¦¦¦¦¦
    +---+
     /¦\\
    +---+
    ¦ ?? ¦
    +---+`,
    baseStats: {
      str: 10,
      dex: 16,
      int: 8,
      hp: 90,
      maxHp: 90,
      mp: 40,
      maxMp: 40,
    },
    growth: { str: 1, dex: 3, int: 1, hp: 10, mp: 3 },
    skill: {
      name: 'Backstab',
      description: 'A sneak attack dealing 3x damage with bonus crit chance.',
      mpCost: 12,
      power: 3.0,
    },
  },
  {
    id: 'cleric',
    name: 'Cleric',
    description: 'A holy healer with balanced stats. Can restore HP in battle.',
    ascii: `
    +---+
    ¦ + ¦
    ¦+-+¦
    ¦¦white¦¦
    +---+
     /white\\
    +---+
    ¦ ? ¦
    +---+`,
    baseStats: {
      str: 10,
      dex: 8,
      int: 12,
      hp: 100,
      maxHp: 100,
      mp: 60,
      maxMp: 60,
    },
    growth: { str: 1, dex: 1, int: 2, hp: 12, mp: 5 },
    skill: {
      name: 'Holy Light',
      description: 'Heals HP equal to 2x INT and deals light damage.',
      mpCost: 12,
      power: 2.0,
    },
  },
];
