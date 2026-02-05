import { OSEClass, AbilityScore, Character } from '../../types';
import { getModifier } from './modifiers';

/**
 * OSE THAC0 (To Hit Armor Class 0) Tables by class and level.
 *
 * THAC0 uses descending AC system: lower AC is better.
 * To hit a target: roll d20 >= (THAC0 - target AC)
 *
 * Based on Old School Essentials Classic Fantasy rules.
 */

// Fighter-type THAC0 progression (Fighter, Dwarf, Elf, Halfling)
const FIGHTER_THAC0: Record<number, number> = {
  1: 19, 2: 19, 3: 19,
  4: 17, 5: 17, 6: 17,
  7: 14, 8: 14, 9: 14,
  10: 12, 11: 12, 12: 12,
  13: 10, 14: 10,
};

// Cleric THAC0 progression
const CLERIC_THAC0: Record<number, number> = {
  1: 19, 2: 19, 3: 19, 4: 19,
  5: 17, 6: 17, 7: 17, 8: 17,
  9: 14, 10: 14, 11: 14, 12: 14,
  13: 12, 14: 12,
};

// Magic-User/Thief THAC0 progression
const MAGE_THIEF_THAC0: Record<number, number> = {
  1: 19, 2: 19, 3: 19, 4: 19,
  5: 19, 6: 17, 7: 17, 8: 17,
  9: 17, 10: 14, 11: 14, 12: 14,
  13: 14, 14: 12,
};

/**
 * Get base THAC0 for a class at a given level
 */
export function getTHAC0(classKey: OSEClass, level: number): number {
  const clampedLevel = Math.max(1, Math.min(14, level));

  switch (classKey) {
    case OSEClass.Fighter:
    case OSEClass.Dwarf:
    case OSEClass.Elf:
    case OSEClass.Halfling:
      return FIGHTER_THAC0[clampedLevel] ?? 19;

    case OSEClass.Cleric:
      return CLERIC_THAC0[clampedLevel] ?? 19;

    case OSEClass.MagicUser:
    case OSEClass.Thief:
      return MAGE_THIEF_THAC0[clampedLevel] ?? 19;

    default:
      return 19;
  }
}

/**
 * Calculate the attack bonus for melee attacks
 * (STR modifier + any temp modifiers)
 */
export function getMeleeAttackBonus(character: Character): number {
  const baseStr = character.abilities[AbilityScore.STR];
  const tempMod = character.abilityModifiers?.[AbilityScore.STR] ?? 0;
  return getModifier(baseStr + tempMod);
}

/**
 * Calculate the attack bonus for ranged attacks
 * (DEX modifier + any temp modifiers)
 */
export function getRangedAttackBonus(character: Character): number {
  const baseDex = character.abilities[AbilityScore.DEX];
  const tempMod = character.abilityModifiers?.[AbilityScore.DEX] ?? 0;
  return getModifier(baseDex + tempMod);
}

/**
 * Calculate the damage bonus for melee attacks
 * (STR modifier + any temp modifiers)
 */
export function getMeleeDamageBonus(character: Character): number {
  const baseStr = character.abilities[AbilityScore.STR];
  const tempMod = character.abilityModifiers?.[AbilityScore.STR] ?? 0;
  return getModifier(baseStr + tempMod);
}

/**
 * Calculate the target number needed to hit on d20
 * Using descending AC: target = THAC0 - targetAC
 *
 * @param thac0 - The attacker's THAC0
 * @param targetAC - The defender's Armor Class (descending)
 * @returns The number needed on d20 to hit
 */
export function getTargetToHit(thac0: number, targetAC: number): number {
  const target = thac0 - targetAC;
  // Minimum of 2 (always miss on 1), maximum of 20 (always hit on 20)
  return Math.max(2, Math.min(20, target));
}

/**
 * Determine if an attack roll hits
 *
 * @param roll - The d20 roll (including modifiers)
 * @param thac0 - The attacker's THAC0
 * @param targetAC - The defender's AC (descending)
 * @returns Whether the attack hits
 */
export function doesAttackHit(roll: number, thac0: number, targetAC: number): boolean {
  // Natural 20 always hits, natural 1 always misses
  // But we're checking the modified roll here, so handle that in the caller
  return roll >= getTargetToHit(thac0, targetAC);
}

/**
 * Format THAC0 display string
 */
export function formatTHAC0(thac0: number): string {
  return `THAC0 ${thac0}`;
}
