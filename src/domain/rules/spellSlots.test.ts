import { describe, it, expect } from 'vitest';
import { OSEClass } from '../../types';
import {
  getSpellSlots,
  canCastSpells,
  getSpellType,
  getMaxSpellLevel,
  getTotalSlots,
} from './spellSlots';

describe('spellSlots', () => {
  describe('canCastSpells', () => {
    it('returns true for spellcasting classes', () => {
      expect(canCastSpells(OSEClass.MagicUser)).toBe(true);
      expect(canCastSpells(OSEClass.Cleric)).toBe(true);
      expect(canCastSpells(OSEClass.Elf)).toBe(true);
    });

    it('returns false for non-spellcasting classes', () => {
      expect(canCastSpells(OSEClass.Fighter)).toBe(false);
      expect(canCastSpells(OSEClass.Thief)).toBe(false);
      expect(canCastSpells(OSEClass.Dwarf)).toBe(false);
      expect(canCastSpells(OSEClass.Halfling)).toBe(false);
    });
  });

  describe('getSpellType', () => {
    it('returns arcane for Magic-User and Elf', () => {
      expect(getSpellType(OSEClass.MagicUser)).toBe('arcane');
      expect(getSpellType(OSEClass.Elf)).toBe('arcane');
    });

    it('returns divine for Cleric', () => {
      expect(getSpellType(OSEClass.Cleric)).toBe('divine');
    });

    it('returns null for non-casters', () => {
      expect(getSpellType(OSEClass.Fighter)).toBeNull();
      expect(getSpellType(OSEClass.Thief)).toBeNull();
    });
  });

  describe('getSpellSlots', () => {
    it('returns correct slots for Magic-User level 1', () => {
      const slots = getSpellSlots(OSEClass.MagicUser, 1);
      expect(slots).toEqual({ 1: 1 });
    });

    it('returns correct slots for Magic-User level 5', () => {
      const slots = getSpellSlots(OSEClass.MagicUser, 5);
      expect(slots).toEqual({ 1: 2, 2: 2, 3: 1 });
    });

    it('returns empty slots for Cleric level 1', () => {
      const slots = getSpellSlots(OSEClass.Cleric, 1);
      expect(slots).toEqual({});
    });

    it('returns correct slots for Cleric level 2', () => {
      const slots = getSpellSlots(OSEClass.Cleric, 2);
      expect(slots).toEqual({ 1: 1 });
    });

    it('returns correct slots for Elf level 3', () => {
      const slots = getSpellSlots(OSEClass.Elf, 3);
      expect(slots).toEqual({ 1: 2, 2: 1 });
    });

    it('returns empty object for non-casters', () => {
      expect(getSpellSlots(OSEClass.Fighter, 5)).toEqual({});
      expect(getSpellSlots(OSEClass.Thief, 10)).toEqual({});
    });

    it('clamps level to valid range', () => {
      // Level 0 should behave as level 1
      expect(getSpellSlots(OSEClass.MagicUser, 0)).toEqual({ 1: 1 });
      // Level 100 should behave as level 14
      expect(getSpellSlots(OSEClass.MagicUser, 100)).toEqual({ 1: 4, 2: 4, 3: 4, 4: 4, 5: 3, 6: 3 });
    });
  });

  describe('getMaxSpellLevel', () => {
    it('returns 1 for Magic-User level 1', () => {
      expect(getMaxSpellLevel(OSEClass.MagicUser, 1)).toBe(1);
    });

    it('returns 3 for Magic-User level 5', () => {
      expect(getMaxSpellLevel(OSEClass.MagicUser, 5)).toBe(3);
    });

    it('returns 0 for non-casters', () => {
      expect(getMaxSpellLevel(OSEClass.Fighter, 10)).toBe(0);
    });

    it('returns 0 for Cleric level 1 (no spells yet)', () => {
      expect(getMaxSpellLevel(OSEClass.Cleric, 1)).toBe(0);
    });
  });

  describe('getTotalSlots', () => {
    it('returns 1 for Magic-User level 1', () => {
      expect(getTotalSlots(OSEClass.MagicUser, 1)).toBe(1);
    });

    it('returns 5 for Magic-User level 5', () => {
      // { 1: 2, 2: 2, 3: 1 } = 5 total
      expect(getTotalSlots(OSEClass.MagicUser, 5)).toBe(5);
    });

    it('returns 0 for non-casters', () => {
      expect(getTotalSlots(OSEClass.Fighter, 10)).toBe(0);
    });
  });
});
