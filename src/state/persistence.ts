import { Character, Item } from '../types';
import { ItemSchema } from '../domain/validation';
import { migrateCharacters } from './migrations';
import { BANK_STORAGE_KEY, EXPORT_VERSION, STORAGE_KEY } from './storage';

/**
 * Validates and parses bank items using Zod schema.
 * Invalid items are logged and skipped to prevent data corruption.
 */
function validateBankItems(rawBank: unknown[]): Item[] {
  return rawBank
    .map((item, index) => {
      const result = ItemSchema.safeParse(item);
      if (result.success) {
        return result.data as Item;
      }
      console.warn(`Skipping invalid bank item at index ${index}:`, result.error.issues);
      return null;
    })
    .filter((item): item is Item => item !== null);
}

export interface PersistedExport {
  version: number;
  date: string;
  characters: Character[];
  bank: Item[];
}

export function loadFromLocalStorage(): { characters: Character[]; bank: Item[] } {
  const savedChars = localStorage.getItem(STORAGE_KEY);
  const savedBank = localStorage.getItem(BANK_STORAGE_KEY);

  let characters: Character[] = [];
  let bank: Item[] = [];

  if (savedChars) {
    try {
      const parsed = JSON.parse(savedChars);
      characters = migrateCharacters(parsed);
    } catch (e) {
      console.error('Failed to parse saved characters', e);
    }
  }

  if (savedBank) {
    try {
      const parsed = JSON.parse(savedBank);
      if (Array.isArray(parsed)) {
        bank = validateBankItems(parsed);
      }
    } catch (e) {
      console.error('Failed to parse saved bank', e);
    }
  }

  return { characters, bank };
}

export function saveToLocalStorage(characters: Character[], bank: Item[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
    localStorage.setItem(BANK_STORAGE_KEY, JSON.stringify(bank));
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      throw new Error('Storage quota exceeded. Please export your data and clear old characters.');
    }
    throw e;
  }
}

export function makeExportBlob(characters: Character[], bank: Item[]): Blob {
  const data: PersistedExport = {
    version: EXPORT_VERSION,
    date: new Date().toISOString(),
    characters,
    bank,
  };
  return new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
}

export function parseImportJson(jsonText: string): { characters?: Character[]; bank?: Item[] } {
  const json = JSON.parse(jsonText);
  const next: { characters?: Character[]; bank?: Item[] } = {};

  if (json.characters && Array.isArray(json.characters)) {
    next.characters = migrateCharacters(json.characters);
  }

  if (json.bank && Array.isArray(json.bank)) {
    next.bank = validateBankItems(json.bank);
  }

  return next;
}
