import type { Character, Item } from './character';

export const BANK_ID = 'BANK_VAULT' as const;

export interface WorldState {
  characters: Character[];
  bank: Item[];
}
