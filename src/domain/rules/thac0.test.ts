import { describe, it, expect } from 'vitest';
import { OSEClass, AbilityScore, INITIAL_CHARACTER } from '../../types';
import {
  getTHAC0,
  getMeleeAttackBonus,
  getRangedAttackBonus,
  getMeleeDamageBonus,
  getTargetToHit,
  doesAttackHit,
} from './thac0';

describe('thac0', () => {
  describe('getTHAC0', () => {
    it('returns 19 for level 1 characters', () => {
      expect(getTHAC0(OSEClass.Fighter, 1)).toBe(19);
      expect(getTHAC0(OSEClass.MagicUser, 1)).toBe(19);
      expect(getTHAC0(OSEClass.Cleric, 1)).toBe(19);
      expect(getTHAC0(OSEClass.Thief, 1)).toBe(19);
    });

    it('uses fighter progression for fighting classes', () => {
      // Fighter-types improve at levels 4 and 7
      expect(getTHAC0(OSEClass.Fighter, 3)).toBe(19);
      expect(getTHAC0(OSEClass.Fighter, 4)).toBe(17);
      expect(getTHAC0(OSEClass.Fighter, 7)).toBe(14);

      // Dwarf, Elf, Halfling use same progression
      expect(getTHAC0(OSEClass.Dwarf, 4)).toBe(17);
      expect(getTHAC0(OSEClass.Elf, 4)).toBe(17);
      expect(getTHAC0(OSEClass.Halfling, 4)).toBe(17);
    });

    it('uses cleric progression for clerics', () => {
      expect(getTHAC0(OSEClass.Cleric, 4)).toBe(19);
      expect(getTHAC0(OSEClass.Cleric, 5)).toBe(17);
      expect(getTHAC0(OSEClass.Cleric, 9)).toBe(14);
    });

    it('uses mage/thief progression', () => {
      expect(getTHAC0(OSEClass.MagicUser, 5)).toBe(19);
      expect(getTHAC0(OSEClass.MagicUser, 6)).toBe(17);
      expect(getTHAC0(OSEClass.Thief, 6)).toBe(17);
    });

    it('clamps level to valid range', () => {
      expect(getTHAC0(OSEClass.Fighter, 0)).toBe(19);
      expect(getTHAC0(OSEClass.Fighter, 100)).toBe(10);
    });
  });

  describe('getMeleeAttackBonus', () => {
    it('returns 0 for average STR (10)', () => {
      const char = { ...INITIAL_CHARACTER };
      expect(getMeleeAttackBonus(char)).toBe(0);
    });

    it('returns positive bonus for high STR', () => {
      const char = {
        ...INITIAL_CHARACTER,
        abilities: { ...INITIAL_CHARACTER.abilities, [AbilityScore.STR]: 16 },
      };
      expect(getMeleeAttackBonus(char)).toBe(2);
    });

    it('returns negative bonus for low STR', () => {
      const char = {
        ...INITIAL_CHARACTER,
        abilities: { ...INITIAL_CHARACTER.abilities, [AbilityScore.STR]: 5 },
      };
      expect(getMeleeAttackBonus(char)).toBe(-2);
    });

    it('includes temporary modifiers', () => {
      const char = {
        ...INITIAL_CHARACTER,
        abilities: { ...INITIAL_CHARACTER.abilities, [AbilityScore.STR]: 14 },
        abilityModifiers: { ...INITIAL_CHARACTER.abilityModifiers, [AbilityScore.STR]: 2 },
      };
      // Base 14 + 2 temp = 16 STR = +2 bonus
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
    it('returns STR modifier', () => {
      const char = {
        ...INITIAL_CHARACTER,
        abilities: { ...INITIAL_CHARACTER.abilities, [AbilityScore.STR]: 18 },
      };
      expect(getMeleeDamageBonus(char)).toBe(3);
    });
  });

  describe('getTargetToHit', () => {
    it('calculates target correctly', () => {
      // THAC0 19 vs AC 9 = need 10
      expect(getTargetToHit(19, 9)).toBe(10);
      // THAC0 19 vs AC 5 = need 14
      expect(getTargetToHit(19, 5)).toBe(14);
      // THAC0 19 vs AC -2 = need 21, clamped to 20
      expect(getTargetToHit(19, -2)).toBe(20);
    });

    it('clamps to minimum of 2', () => {
      // THAC0 10 vs AC 15 = need -5, clamped to 2
      expect(getTargetToHit(10, 15)).toBe(2);
    });

    it('clamps to maximum of 20', () => {
      // THAC0 19 vs AC -5 = need 24, clamped to 20
      expect(getTargetToHit(19, -5)).toBe(20);
    });
  });

  describe('doesAttackHit', () => {
    it('returns true when roll meets target', () => {
      // Need 10 to hit, rolled 10
      expect(doesAttackHit(10, 19, 9)).toBe(true);
      // Need 10 to hit, rolled 15
      expect(doesAttackHit(15, 19, 9)).toBe(true);
    });

    it('returns false when roll is below target', () => {
      // Need 10 to hit, rolled 9
      expect(doesAttackHit(9, 19, 9)).toBe(false);
    });
  });
});
