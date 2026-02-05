import { describe, it, expect } from 'vitest';
import { OSEClass, AbilityScore, INITIAL_CHARACTER } from '../../types';
import {
  getBaseAttackBonus,
  getMeleeAttackBonus,
  getRangedAttackBonus,
  getMeleeDamageBonus,
  doesAttackHit,
} from './thac0';

describe('thac0 (ascending AC)', () => {
  describe('getBaseAttackBonus', () => {
    it('returns 0 for level 1 characters', () => {
      expect(getBaseAttackBonus(OSEClass.Fighter, 1)).toBe(0);
      expect(getBaseAttackBonus(OSEClass.MagicUser, 1)).toBe(0);
      expect(getBaseAttackBonus(OSEClass.Cleric, 1)).toBe(0);
      expect(getBaseAttackBonus(OSEClass.Thief, 1)).toBe(0);
    });

    it('uses fighter progression for fighting classes', () => {
      // Fighter-types improve at levels 4 and 7
      expect(getBaseAttackBonus(OSEClass.Fighter, 3)).toBe(0);
      expect(getBaseAttackBonus(OSEClass.Fighter, 4)).toBe(2);
      expect(getBaseAttackBonus(OSEClass.Fighter, 7)).toBe(5);

      // Dwarf, Elf, Halfling use same progression
      expect(getBaseAttackBonus(OSEClass.Dwarf, 4)).toBe(2);
      expect(getBaseAttackBonus(OSEClass.Elf, 4)).toBe(2);
      expect(getBaseAttackBonus(OSEClass.Halfling, 4)).toBe(2);
    });

    it('uses cleric progression for clerics', () => {
      expect(getBaseAttackBonus(OSEClass.Cleric, 4)).toBe(0);
      expect(getBaseAttackBonus(OSEClass.Cleric, 5)).toBe(2);
      expect(getBaseAttackBonus(OSEClass.Cleric, 9)).toBe(5);
    });

    it('uses mage/thief progression', () => {
      expect(getBaseAttackBonus(OSEClass.MagicUser, 5)).toBe(0);
      expect(getBaseAttackBonus(OSEClass.MagicUser, 6)).toBe(2);
      expect(getBaseAttackBonus(OSEClass.Thief, 6)).toBe(2);
    });

    it('clamps level to valid range', () => {
      expect(getBaseAttackBonus(OSEClass.Fighter, 0)).toBe(0);
      expect(getBaseAttackBonus(OSEClass.Fighter, 100)).toBe(9);
    });
  });

  describe('getMeleeAttackBonus', () => {
    it('returns base bonus for average STR (10)', () => {
      const char = { ...INITIAL_CHARACTER };
      // Level 1 Fighter with STR 10 = base 0 + mod 0 = 0
      expect(getMeleeAttackBonus(char)).toBe(0);
    });

    it('includes STR modifier', () => {
      const char = {
        ...INITIAL_CHARACTER,
        abilities: { ...INITIAL_CHARACTER.abilities, [AbilityScore.STR]: 16 },
      };
      // Level 1 base 0 + STR 16 mod +2 = 2
      expect(getMeleeAttackBonus(char)).toBe(2);
    });

    it('returns negative bonus for low STR', () => {
      const char = {
        ...INITIAL_CHARACTER,
        abilities: { ...INITIAL_CHARACTER.abilities, [AbilityScore.STR]: 5 },
      };
      // Level 1 base 0 + STR 5 mod -2 = -2
      expect(getMeleeAttackBonus(char)).toBe(-2);
    });

    it('includes base attack bonus from level', () => {
      const char = {
        ...INITIAL_CHARACTER,
        level: 4,
        abilities: { ...INITIAL_CHARACTER.abilities, [AbilityScore.STR]: 10 },
      };
      // Level 4 Fighter base 2 + STR 10 mod 0 = 2
      expect(getMeleeAttackBonus(char)).toBe(2);
    });

    it('includes temporary modifiers', () => {
      const char = {
        ...INITIAL_CHARACTER,
        abilities: { ...INITIAL_CHARACTER.abilities, [AbilityScore.STR]: 14 },
        abilityModifiers: { ...INITIAL_CHARACTER.abilityModifiers, [AbilityScore.STR]: 2 },
      };
      // Base 14 + 2 temp = 16 STR = +2 mod, level 1 base 0, total = 2
      expect(getMeleeAttackBonus(char)).toBe(2);
    });
  });

  describe('getRangedAttackBonus', () => {
    it('uses DEX instead of STR', () => {
      const char = {
        ...INITIAL_CHARACTER,
        abilities: {
          ...INITIAL_CHARACTER.abilities,
          [AbilityScore.STR]: 18,
          [AbilityScore.DEX]: 5,
        },
      };
      // Should use DEX (-2), not STR (+3)
      expect(getRangedAttackBonus(char)).toBe(-2);
    });
  });

  describe('getMeleeDamageBonus', () => {
    it('returns STR modifier only (no base attack)', () => {
      const char = {
        ...INITIAL_CHARACTER,
        level: 10, // High level shouldn't affect damage
        abilities: { ...INITIAL_CHARACTER.abilities, [AbilityScore.STR]: 18 },
      };
      expect(getMeleeDamageBonus(char)).toBe(3);
    });
  });

  describe('doesAttackHit', () => {
    it('returns true when roll meets target AC', () => {
      // Roll 15 vs AC 15 = hit
      expect(doesAttackHit(15, 15)).toBe(true);
    });

    it('returns true when roll exceeds target AC', () => {
      // Roll 18 vs AC 12 = hit
      expect(doesAttackHit(18, 12)).toBe(true);
    });

    it('returns false when roll is below target AC', () => {
      // Roll 10 vs AC 15 = miss
      expect(doesAttackHit(10, 15)).toBe(false);
    });
  });
});
