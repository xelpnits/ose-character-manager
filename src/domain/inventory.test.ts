import { describe, it, expect } from 'vitest';
import { areItemsStackable } from './inventory';
import { Item, ItemCategory } from '../types';

const createItem = (overrides: Partial<Item> = {}): Item => ({
  id: 'test-id',
  name: 'Test Item',
  count: 1,
  weight: 10,
  ...overrides,
});

describe('areItemsStackable', () => {
  it('should return true for identical items', () => {
    const itemA = createItem({ name: 'Torch', category: ItemCategory.Tool });
    const itemB = createItem({ name: 'Torch', category: ItemCategory.Tool });

    expect(areItemsStackable(itemA, itemB)).toBe(true);
  });

  it('should return false for items with different names', () => {
    const itemA = createItem({ name: 'Torch' });
    const itemB = createItem({ name: 'Rope' });

    expect(areItemsStackable(itemA, itemB)).toBe(false);
  });

  it('should return false for items with different categories', () => {
    const itemA = createItem({ name: 'Sword', category: ItemCategory.Weapon });
    const itemB = createItem({ name: 'Sword', category: ItemCategory.Tool });

    expect(areItemsStackable(itemA, itemB)).toBe(false);
  });

  it('should return false if one item is magical and the other is not', () => {
    const itemA = createItem({ name: 'Sword', isMagical: true });
    const itemB = createItem({ name: 'Sword', isMagical: false });

    expect(areItemsStackable(itemA, itemB)).toBe(false);
  });

  it('should return false for items with different gold values', () => {
    const itemA = createItem({ name: 'Gem', goldValue: 100 });
    const itemB = createItem({ name: 'Gem', goldValue: 50 });

    expect(areItemsStackable(itemA, itemB)).toBe(false);
  });

  it('should return false for items with different damage values', () => {
    const itemA = createItem({ name: 'Sword', damage: '1d8' });
    const itemB = createItem({ name: 'Sword', damage: '1d6' });

    expect(areItemsStackable(itemA, itemB)).toBe(false);
  });

  it('should return false for items with different armor values', () => {
    const itemA = createItem({ name: 'Shield', armor: 1 });
    const itemB = createItem({ name: 'Shield', armor: 2 });

    expect(areItemsStackable(itemA, itemB)).toBe(false);
  });

  it('should return false for items with different descriptions', () => {
    const itemA = createItem({ name: 'Potion', description: 'Healing' });
    const itemB = createItem({ name: 'Potion', description: 'Poison' });

    expect(areItemsStackable(itemA, itemB)).toBe(false);
  });

  it('should return false if one item is unidentified and the other is not', () => {
    const itemA = createItem({ name: 'Wand', isUnidentified: true });
    const itemB = createItem({ name: 'Wand', isUnidentified: false });

    expect(areItemsStackable(itemA, itemB)).toBe(false);
  });

  it('should return false for items with different max charges', () => {
    const itemA = createItem({ name: 'Wand', maxCharges: 10 });
    const itemB = createItem({ name: 'Wand', maxCharges: 20 });

    expect(areItemsStackable(itemA, itemB)).toBe(false);
  });

  it('should ignore different IDs when checking stackability', () => {
    const itemA = createItem({ id: 'id-1', name: 'Arrow' });
    const itemB = createItem({ id: 'id-2', name: 'Arrow' });

    expect(areItemsStackable(itemA, itemB)).toBe(true);
  });

  it('should ignore different counts when checking stackability', () => {
    const itemA = createItem({ name: 'Arrow', count: 10 });
    const itemB = createItem({ name: 'Arrow', count: 5 });

    expect(areItemsStackable(itemA, itemB)).toBe(true);
  });

  it('should ignore different weights when checking stackability', () => {
    const itemA = createItem({ name: 'Ration', weight: 10 });
    const itemB = createItem({ name: 'Ration', weight: 5 });

    expect(areItemsStackable(itemA, itemB)).toBe(true);
  });
});
