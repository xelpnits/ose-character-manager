import { describe, it, expect } from 'vitest';
import { ItemSchema, ContainerSchema, CharacterSchema, ExportSchema } from './validation';
import { ItemCategory, OSEClass, Alignment } from '../types';

describe('ItemSchema', () => {
  it('should validate a minimal valid item', () => {
    const item = {
      id: 'item-1',
      name: 'Torch',
      count: 1,
      weight: 10,
    };

    const result = ItemSchema.safeParse(item);
    expect(result.success).toBe(true);
  });

  it('should validate an item with all optional fields', () => {
    const item = {
      id: 'item-1',
      name: 'Magic Sword',
      count: 1,
      weight: 50,
      description: 'A gleaming blade',
      category: ItemCategory.Weapon,
      damage: '1d8',
      armor: 0,
      charges: 5,
      maxCharges: 10,
      isEquipped: true,
      isMagical: true,
      isUnidentified: false,
      goldValue: 1000,
      isUnclaimed: false,
    };

    const result = ItemSchema.safeParse(item);
    expect(result.success).toBe(true);
  });

  it('should reject an item with count less than 1', () => {
    const item = {
      id: 'item-1',
      name: 'Torch',
      count: 0,
      weight: 10,
    };

    const result = ItemSchema.safeParse(item);
    expect(result.success).toBe(false);
  });

  it('should reject an item missing required fields', () => {
    const item = {
      id: 'item-1',
      name: 'Torch',
      // missing count and weight
    };

    const result = ItemSchema.safeParse(item);
    expect(result.success).toBe(false);
  });

  it('should accept string categories for loose parsing on imports', () => {
    const item = {
      id: 'item-1',
      name: 'Custom Item',
      count: 1,
      weight: 5,
      category: 'CustomCategory',
    };

    const result = ItemSchema.safeParse(item);
    expect(result.success).toBe(true);
  });
});

describe('ContainerSchema', () => {
  it('should validate a minimal valid container', () => {
    const container = {
      id: 'container-1',
      name: 'Backpack',
      items: [],
    };

    const result = ContainerSchema.safeParse(container);
    expect(result.success).toBe(true);
  });

  it('should validate a container with items', () => {
    const container = {
      id: 'container-1',
      name: 'Backpack',
      type: 'carried',
      items: [
        { id: 'item-1', name: 'Torch', count: 5, weight: 10 },
        { id: 'item-2', name: 'Rope', count: 1, weight: 50 },
      ],
      isFixed: false,
      maxWeight: 400,
    };

    const result = ContainerSchema.safeParse(container);
    expect(result.success).toBe(true);
  });

  it('should reject invalid container type', () => {
    const container = {
      id: 'container-1',
      name: 'Backpack',
      type: 'invalid-type',
      items: [],
    };

    const result = ContainerSchema.safeParse(container);
    expect(result.success).toBe(false);
  });
});

describe('CharacterSchema', () => {
  const validCharacter = {
    id: 'char-1',
    name: 'Thorin',
    class: OSEClass.Dwarf,
    level: 1,
    alignment: Alignment.Lawful,
    abilities: {
      STR: 14,
      INT: 10,
      WIS: 12,
      DEX: 10,
      CON: 16,
      CHA: 8,
    },
    hp: 8,
    maxHp: 8,
    ac: 5,
    savingThrows: {
      death: 8,
      wands: 9,
      paralysis: 10,
      breath: 13,
      spells: 12,
    },
    containers: [],
    xp: 0,
  };

  it('should validate a minimal valid character', () => {
    const result = CharacterSchema.safeParse(validCharacter);
    expect(result.success).toBe(true);
  });

  it('should validate a character with temporary modifiers', () => {
    const character = {
      ...validCharacter,
      tempHp: 5,
      acModifier: -2,
      abilityModifiers: {
        STR: 2,
        INT: 0,
        WIS: 0,
        DEX: 0,
        CON: 0,
        CHA: 0,
      },
      saveModifiers: {
        death: 2,
        spells: 1,
      },
    };

    const result = CharacterSchema.safeParse(character);
    expect(result.success).toBe(true);
  });

  it('should accept string class for loose parsing', () => {
    const character = {
      ...validCharacter,
      class: 'CustomClass',
    };

    const result = CharacterSchema.safeParse(character);
    expect(result.success).toBe(true);
  });

  it('should reject character missing required abilities', () => {
    const character = {
      ...validCharacter,
      abilities: {
        STR: 14,
        // Missing other abilities
      },
    };

    const result = CharacterSchema.safeParse(character);
    expect(result.success).toBe(false);
  });
});

describe('ExportSchema', () => {
  it('should validate a minimal export', () => {
    const exportData = {
      characters: [],
      bank: [],
    };

    const result = ExportSchema.safeParse(exportData);
    expect(result.success).toBe(true);
  });

  it('should validate a full export with version and date', () => {
    const exportData = {
      version: 1,
      date: '2025-01-15T10:00:00.000Z',
      characters: [
        {
          id: 'char-1',
          name: 'Test Hero',
          class: OSEClass.Fighter,
          level: 1,
          alignment: Alignment.Neutral,
          abilities: {
            STR: 10,
            INT: 10,
            WIS: 10,
            DEX: 10,
            CON: 10,
            CHA: 10,
          },
          hp: 5,
          maxHp: 5,
          ac: 9,
          savingThrows: {
            death: 12,
            wands: 13,
            paralysis: 14,
            breath: 15,
            spells: 16,
          },
          containers: [],
          xp: 0,
        },
      ],
      bank: [
        { id: 'bank-item-1', name: 'Gold Coins', count: 100, weight: 100 },
      ],
    };

    const result = ExportSchema.safeParse(exportData);
    expect(result.success).toBe(true);
  });
});
