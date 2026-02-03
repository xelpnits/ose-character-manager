import { AbilityScore, OSEClass } from '../types';

export const ABILITY_LABELS: Record<AbilityScore, string> = {
  [AbilityScore.STR]: 'Strength',
  [AbilityScore.INT]: 'Intelligence',
  [AbilityScore.WIS]: 'Wisdom',
  [AbilityScore.DEX]: 'Dexterity',
  [AbilityScore.CON]: 'Constitution',
  [AbilityScore.CHA]: 'Charisma',
};

export const CLASS_OPTIONS = Object.values(OSEClass);
