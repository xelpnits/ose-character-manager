import { OSEClass } from '../../types';

/**
 * OSE Spell Slot Tables by class and level.
 *
 * Each entry maps level -> spell slots per spell level.
 * Example: { 1: 1 } means 1 first-level spell slot.
 *
 * Based on Old School Essentials Classic Fantasy rules.
 */

type SpellSlots = Record<number, number>; // spell level -> number of slots

// Magic-User spell progression (levels 1-14)
const MAGIC_USER_SLOTS: Record<number, SpellSlots> = {
  1: { 1: 1 },
  2: { 1: 2 },
  3: { 1: 2, 2: 1 },
  4: { 1: 2, 2: 2 },
  5: { 1: 2, 2: 2, 3: 1 },
  6: { 1: 2, 2: 2, 3: 2 },
  7: { 1: 3, 2: 2, 3: 2, 4: 1 },
  8: { 1: 3, 2: 3, 3: 2, 4: 2 },
  9: { 1: 3, 2: 3, 3: 3, 4: 2, 5: 1 },
  10: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 2 },
  11: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 },
  12: { 1: 4, 2: 4, 3: 3, 4: 3, 5: 3, 6: 2 },
  13: { 1: 4, 2: 4, 3: 4, 4: 3, 5: 3, 6: 2 },
  14: { 1: 4, 2: 4, 3: 4, 4: 4, 5: 3, 6: 3 },
};

// Cleric spell progression (levels 1-14)
// Clerics start casting at level 2
const CLERIC_SLOTS: Record<number, SpellSlots> = {
  1: {},
  2: { 1: 1 },
  3: { 1: 2 },
  4: { 1: 2, 2: 1 },
  5: { 1: 2, 2: 2 },
  6: { 1: 2, 2: 2, 3: 1 },
  7: { 1: 2, 2: 2, 3: 2 },
  8: { 1: 3, 2: 2, 3: 2, 4: 1 },
  9: { 1: 3, 2: 3, 3: 2, 4: 2 },
  10: { 1: 3, 2: 3, 3: 3, 4: 2, 5: 1 },
  11: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 },
  12: { 1: 4, 2: 4, 3: 3, 4: 3, 5: 2 },
  13: { 1: 4, 2: 4, 3: 4, 4: 3, 5: 3 },
  14: { 1: 4, 2: 4, 3: 4, 4: 4, 5: 3 },
};

// Elf spell progression (same as Magic-User but capped lower)
// Elves use Magic-User spells, progression similar
const ELF_SLOTS: Record<number, SpellSlots> = {
  1: { 1: 1 },
  2: { 1: 2 },
  3: { 1: 2, 2: 1 },
  4: { 1: 2, 2: 2 },
  5: { 1: 2, 2: 2, 3: 1 },
  6: { 1: 2, 2: 2, 3: 2 },
  7: { 1: 3, 2: 2, 3: 2, 4: 1 },
  8: { 1: 3, 2: 3, 3: 2, 4: 2 },
  9: { 1: 3, 2: 3, 3: 3, 4: 2, 5: 1 },
  10: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 2 },
};

/**
 * Classes that can cast spells
 */
export const SPELLCASTING_CLASSES: OSEClass[] = [
  OSEClass.MagicUser,
  OSEClass.Cleric,
  OSEClass.Elf,
];

/**
 * Check if a class can cast spells at any level
 */
export function canCastSpells(classKey: OSEClass): boolean {
  return SPELLCASTING_CLASSES.includes(classKey);
}

/**
 * Get the spell type for a spellcasting class
 */
export function getSpellType(classKey: OSEClass): 'arcane' | 'divine' | null {
  switch (classKey) {
    case OSEClass.MagicUser:
    case OSEClass.Elf:
      return 'arcane';
    case OSEClass.Cleric:
      return 'divine';
    default:
      return null;
  }
}

/**
 * Get spell slots for a given class and level.
 * Returns an object mapping spell level to number of slots.
 * Returns empty object for non-casters or if level has no slots.
 *
 * @param classKey - The OSE character class
 * @param level - Character level (1-14)
 * @returns Record mapping spell level (1-6) to number of slots
 */
export function getSpellSlots(classKey: OSEClass, level: number): SpellSlots {
  // Clamp level to valid range
  const clampedLevel = Math.max(1, Math.min(14, level));

  switch (classKey) {
    case OSEClass.MagicUser:
      return { ...(MAGIC_USER_SLOTS[clampedLevel] || {}) };
    case OSEClass.Cleric:
      return { ...(CLERIC_SLOTS[clampedLevel] || {}) };
    case OSEClass.Elf:
      // Elf max level is 10, use that or actual level
      const elfLevel = Math.min(clampedLevel, 10);
      return { ...(ELF_SLOTS[elfLevel] || {}) };
    default:
      // Non-casters
      return {};
  }
}

/**
 * Get the maximum spell level a class can cast at a given level
 */
export function getMaxSpellLevel(classKey: OSEClass, level: number): number {
  const slots = getSpellSlots(classKey, level);
  const spellLevels = Object.keys(slots).map(Number);
  return spellLevels.length > 0 ? Math.max(...spellLevels) : 0;
}

/**
 * Get total number of spell slots for a class at a given level
 */
export function getTotalSlots(classKey: OSEClass, level: number): number {
  const slots = getSpellSlots(classKey, level);
  return Object.values(slots).reduce((sum, n) => sum + n, 0);
}
