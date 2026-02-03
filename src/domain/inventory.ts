import { Item } from '../types';

/**
 * Checks if two items are stackable based on OSE rules + strict identity.
 */
export const areItemsStackable = (a: Item, b: Item): boolean => {
  return (
    a.name === b.name &&
    a.category === b.category &&
    a.isMagical === b.isMagical &&
    a.goldValue === b.goldValue &&
    a.damage === b.damage &&
    a.armor === b.armor &&
    a.description === b.description && // Notes must match
    a.isUnidentified === b.isUnidentified &&
    a.maxCharges === b.maxCharges
  );
};

// NOTE: transferItemAtomic and related helper functions (findSourceItem, getTargetList)
// were removed as dead code. If atomic world-state transfers are needed in the future,
// consider implementing them in useWorldState.ts with proper React state integration.