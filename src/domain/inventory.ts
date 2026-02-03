import { Character, Item, Container } from '../types';
import { BANK_ID } from '../types';

export interface WorldState {
  characters: Character[];
  bank: Item[];
}

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

/**
 * Finds an item within the entire world state.
 */
const findSourceItem = (
  state: WorldState,
  ownerId: string,
  containerId: string,
  itemId: string
): { list: Item[], index: number, item: Item } | null => {
  
  // 1. Check Bank
  if (ownerId === BANK_ID) {
    const index = state.bank.findIndex(i => i.id === itemId);
    if (index === -1) return null;
    return { list: state.bank, index, item: state.bank[index] };
  }

  // 2. Check Characters
  const char = state.characters.find(c => c.id === ownerId);
  if (!char) return null;

  // Specific container
  if (containerId !== 'any') {
    const container = char.containers.find(c => c.id === containerId);
    if (!container) return null;
    const index = container.items.findIndex(i => i.id === itemId);
    if (index === -1) return null;
    return { list: container.items, index, item: container.items[index] };
  }

  // Any container (fallback search)
  for (const container of char.containers) {
    const index = container.items.findIndex(i => i.id === itemId);
    if (index !== -1) {
      return { list: container.items, index, item: container.items[index] };
    }
  }

  return null;
};

/**
 * Determines the target item list based on owner and heuristics.
 */
const getTargetList = (state: WorldState, ownerId: string): Item[] | null => {
  if (ownerId === BANK_ID) return state.bank;

  const char = state.characters.find(c => c.id === ownerId);
  if (!char) return null;

  // Heuristic: Backpack -> First Non-Fixed -> First Available
  let target = char.containers.find(c => 
    !c.isFixed && 
    (c.name.toLowerCase().includes('rucksack') || c.name.toLowerCase().includes('backpack'))
  );
  
  if (!target) target = char.containers.find(c => !c.isFixed);
  if (!target) target = char.containers[0];

  return target ? target.items : null;
};

/**
 * Executes a move transaction. Returns a NEW state (immutable) or throws error.
 */
export const transferItemAtomic = (
  currentState: WorldState,
  sourceOwnerId: string,
  sourceContainerId: string,
  itemId: string,
  targetOwnerId: string,
  quantity: number
): WorldState => {
  
  // 1. Deep Clone (structuredClone is now widely supported in modern browsers)
  const nextState: WorldState = structuredClone(currentState);

  // 2. Locate Source
  const sourceCtx = findSourceItem(nextState, sourceOwnerId, sourceContainerId, itemId);
  if (!sourceCtx) {
    throw new Error("Source item not found.");
  }
  
  const { list: sourceList, index: sourceIndex, item: itemToMove } = sourceCtx;

  // 3. Validate Quantity
  if (quantity <= 0) throw new Error("Invalid quantity.");
  if (itemToMove.count < quantity) throw new Error("Not enough items.");

  // 4. Locate Target
  const targetList = getTargetList(nextState, targetOwnerId);
  if (!targetList) {
    throw new Error("Target container not found.");
  }

  // 5. Execute: Remove/Reduce from Source
  if (itemToMove.count === quantity) {
    sourceList.splice(sourceIndex, 1);
  } else {
    itemToMove.count -= quantity;
  }

  // 6. Execute: Add/Merge to Target
  // We construct a 'virtual' item to check stacking against
  const movedItemTemplate = { ...itemToMove, count: quantity };
  
  const existingStack = targetList.find(i => areItemsStackable(i, movedItemTemplate));

  if (existingStack) {
    existingStack.count += quantity;
  } else {
    targetList.push({
      ...movedItemTemplate,
      id: crypto.randomUUID(), // New ID for new location
    });
  }

  return nextState;
};