import { OSEClass, AbilityScore, Character } from '../../types';
import { getModifier } from './modifiers';

/**
 * OSE Attack Bonus Tables by class and level.
 *
 * Uses ascending AC system: roll d20 + attack bonus >= target AC to hit.
 *
 * Based on Old School Essentials Classic Fantasy rules.
 */

// Fighter-type attack bonus progression (Fighter, Dwarf, Elf, Halfling)
const FIGHTER_ATTACK_BONUS: Record<number, number> = {
  1: 0, 2: 0, 3: 0,
  4: 2, 5: 2, 6: 2,
  7: 5, 8: 5, 9: 5,
  10: 7, 11: 7, 12: 7,
  13: 9, 14: 9,
};

// Cleric attack bonus progression
const CLERIC_ATTACK_BONUS: Record<number, number> = {
  1: 0, 2: 0, 3: 0, 4: 0,
  5: 2, 6: 2, 7: 2, 8: 2,
  9: 5, 10: 5, 11: 5, 12: 5,
  13: 7, 14: 7,
};

// Magic-User/Thief attack bonus progression
const MAGE_THIEF_ATTACK_BONUS: Record<number, number> = {
  1: 0, 2: 0, 3: 0, 4: 0,
  5: 0, 6: 2, 7: 2, 8: 2,
  9: 2, 10: 5, 11: 5, 12: 5,
  13: 5, 14: 7,
};

/**
 * Get base attack bonus for a class at a given level
 */
export function getBaseAttackBonus(classKey: OSEClass, level: number): number {
  const clampedLevel = Math.max(1, Math.min(14, level));

  switch (classKey) {
    case OSEClass.Fighter:
    case OSEClass.Dwarf:
    case OSEClass.Elf:
    case OSEClass.Halfling:
      return FIGHTER_ATTACK_BONUS[clampedLevel] ?? 0;

    case OSEClass.Cleric:
      return CLERIC_ATTACK_BONUS[clampedLevel] ?? 0;

    case OSEClass.MagicUser:
    case OSEClass.Thief:
      return MAGE_THIEF_ATTACK_BONUS[clampedLevel] ?? 0;

    default:
      return 0;
  }
}

/**
 * Calculate the attack bonus for melee attacks
 * (Base + STR modifier + any temp modifiers)
 */
export function getMeleeAttackBonus(character: Character): number {
  const baseBonus = getBaseAttackBonus(character.class, character.level);
  const baseStr = character.abilities[AbilityScore.STR];
  const tempMod = character.abilityModifiers?.[AbilityScore.STR] ?? 0;
  return baseBonus + getModifier(baseStr + tempMod);
}

/**
 * Calculate the attack bonus for ranged attacks
 * (Base + DEX modifier + any temp modifiers)
 */
export function getRangedAttackBonus(character: Character): number {
  const baseBonus = getBaseAttackBonus(character.class, character.level);
  const baseDex = character.abilities[AbilityScore.DEX];
  const tempMod = character.abilityModifiers?.[AbilityScore.DEX] ?? 0;
  return baseBonus + getModifier(baseDex + tempMod);
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
 * Determine if an attack roll hits (ascending AC system)
 * Roll d20 + bonus >= target AC = hit
 *
 * @param rollTotal - The d20 roll + all bonuses
 * @param targetAC - The defender's AC (ascending)
 * @returns Whether the attack hits
 */
export function doesAttackHit(rollTotal: number, targetAC: number): boolean {
  return rollTotal >= targetAC;
}

/**
 * Format attack bonus display string
 */
export function formatAttackBonus(bonus: number): string {
  return bonus >= 0 ? `+${bonus}` : `${bonus}`;
}
