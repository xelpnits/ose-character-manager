import { AbilityScore, OSEClass } from './types';

export const ABILITY_LABELS: Record<AbilityScore, string> = {
  [AbilityScore.STR]: 'Strength',
  [AbilityScore.INT]: 'Intelligence',
  [AbilityScore.WIS]: 'Wisdom',
  [AbilityScore.DEX]: 'Dexterity',
  [AbilityScore.CON]: 'Constitution',
  [AbilityScore.CHA]: 'Charisma',
};

export const CLASS_OPTIONS = Object.values(OSEClass);

export const getModifier = (score: number): number => {
  if (score <= 3) return -3;
  if (score <= 5) return -2;
  if (score <= 8) return -1;
  if (score <= 12) return 0;
  if (score <= 15) return 1;
  if (score <= 17) return 2;
  return 3;
};

export const formatModifier = (mod: number): string => {
  return mod >= 0 ? `+${mod}` : `${mod}`;
};

// Simplified Save Tables for Level 1 (could be expanded)
export const LEVEL_1_SAVES: Record<OSEClass, { death: number, wands: number, paralysis: number, breath: number, spells: number }> = {
  [OSEClass.Cleric]: { death: 11, wands: 12, paralysis: 14, breath: 16, spells: 15 },
  [OSEClass.Dwarf]: { death: 8, wands: 9, paralysis: 10, breath: 13, spells: 12 },
  [OSEClass.Elf]: { death: 12, wands: 13, paralysis: 13, breath: 15, spells: 15 },
  [OSEClass.Fighter]: { death: 12, wands: 13, paralysis: 14, breath: 15, spells: 16 },
  [OSEClass.Halfling]: { death: 8, wands: 9, paralysis: 10, breath: 13, spells: 12 },
  [OSEClass.MagicUser]: { death: 13, wands: 14, paralysis: 13, breath: 16, spells: 15 },
  [OSEClass.Thief]: { death: 13, wands: 14, paralysis: 13, breath: 16, spells: 15 },
};