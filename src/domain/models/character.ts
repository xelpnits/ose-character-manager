export enum AbilityScore {
  STR = 'STR',
  INT = 'INT',
  WIS = 'WIS',
  DEX = 'DEX',
  CON = 'CON',
  CHA = 'CHA',
}

export enum OSEClass {
  Cleric = 'Cleric',
  Dwarf = 'Dwarf',
  Elf = 'Elf',
  Fighter = 'Fighter',
  Halfling = 'Halfling',
  MagicUser = 'Magic-User',
  Thief = 'Thief',
}

export enum Alignment {
  Lawful = 'Lawful',
  Neutral = 'Neutral',
  Chaotic = 'Chaotic',
}

export enum ItemCategory {
  General = 'General',
  Weapon = 'Weapon',
  Armor = 'Armor',
  Potion = 'Potion',
  Treasure = 'Treasure',
  Scroll = 'Scroll',
  Tool = 'Tool',
  Consumable = 'Consumable',
  Container = 'Container',
  Misc = 'Misc',
}

export interface SavingThrows {
  death: number;
  wands: number;
  paralysis: number;
  breath: number;
  spells: number;
}

/**
 * A learned spell in a character's spellbook or prayer list.
 */
export interface Spell {
  id: string;
  name: string;
  level: number; // Spell level (1-6)
  description?: string;
  duration?: string;
  range?: string;
}

/**
 * A combat action log entry for attack rolls.
 */
export interface CombatLogEntry {
  id: string;
  timestamp: number; // epoch ms
  type: 'attack' | 'damage' | 'save';
  weaponName: string;
  attackRoll?: number; // d20 roll (natural)
  attackBonus?: number;
  attackTotal?: number;
  targetAC?: number;
  hit?: boolean;
  damageRoll?: string; // e.g., "[3, 4] + 2"
  damageTotal?: number;
  notes?: string; // Critical hit, fumble, etc.
}

export interface Item {
  id: string;
  name: string;
  count: number;
  weight: number; // In OSE usually "Coins" (cn). 1 lb ~= 10 coins.
  description?: string;

  // Tags & Properties
  category?: ItemCategory;
  damage?: string; // e.g. "1d8"
  armor?: number; // AC bonus or value
  charges?: number; // For wands, staves, etc.
  maxCharges?: number;
  isEquipped?: boolean;
  isMagical?: boolean; // Is confirmed magical
  isUnidentified?: boolean; // Needs research / detection

  // Loot & XP Tracking
  goldValue?: number; // Value in GP
  isUnclaimed?: boolean; // If true, this item counts towards the "New Items" XP calculation

  // Combat properties
  isRanged?: boolean; // True for ranged weapons (uses DEX for attack)
}

export type ContainerType = 'equipped' | 'carried' | 'stored';

export interface Container {
  id: string;
  name: string;
  type: ContainerType;
  items: Item[];
  isFixed?: boolean; // For default containers like "Worn"
  maxWeight?: number; // Maximum capacity in cn
}

export interface Character {
  id: string;
  name: string;
  class: OSEClass;
  level: number;
  alignment: Alignment;
  title?: string;

  // Ability Scores
  abilities: Record<AbilityScore, number>;
  abilityModifiers: Record<AbilityScore, number>; // Temp modifiers (e.g. spells)

  // Combat
  hp: number;
  maxHp: number;
  tempHp: number; // Temporary Hit Points
  ac: number;
  acModifier: number; // Temp AC bonus (e.g. spell or situation)

  // Saves
  savingThrows: SavingThrows;
  saveModifiers: Partial<SavingThrows>; // Temp modifiers for saves

  // Fluff & Inventory
  backstory: string;
  containers: Container[]; // New structure
  xp: number;

  // Magic
  learnedSpells: Spell[];

  // Combat Log (per-character action history)
  combatLog: CombatLogEntry[];
}

export const DEFAULT_SAVES: SavingThrows = {
  death: 13,
  wands: 14,
  paralysis: 13,
  breath: 16,
  spells: 15,
};

export const INITIAL_CHARACTER: Character = {
  id: '',
  name: '',
  class: OSEClass.Fighter,
  level: 1,
  alignment: Alignment.Neutral,
  abilities: {
    [AbilityScore.STR]: 10,
    [AbilityScore.INT]: 10,
    [AbilityScore.WIS]: 10,
    [AbilityScore.DEX]: 10,
    [AbilityScore.CON]: 10,
    [AbilityScore.CHA]: 10,
  },
  abilityModifiers: {
    [AbilityScore.STR]: 0,
    [AbilityScore.INT]: 0,
    [AbilityScore.WIS]: 0,
    [AbilityScore.DEX]: 0,
    [AbilityScore.CON]: 0,
    [AbilityScore.CHA]: 0,
  },
  hp: 6,
  maxHp: 6,
  tempHp: 0,
  ac: 9,
  acModifier: 0,
  savingThrows: DEFAULT_SAVES,
  saveModifiers: {
    death: 0,
    wands: 0,
    paralysis: 0,
    breath: 0,
    spells: 0,
  },
  backstory: '',
  containers: [
    { id: 'worn', name: 'Worn / Belt', type: 'equipped', items: [], isFixed: true },
    { id: 'backpack', name: 'Backpack', type: 'carried', items: [], maxWeight: 400 },
  ],
  xp: 0,
  learnedSpells: [],
  combatLog: [],
};
