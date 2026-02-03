import { describe, it, expect } from 'vitest';
import { getModifier, formatModifier, LEVEL_1_SAVES } from './modifiers';
import { OSEClass } from '../../types';

describe('getModifier', () => {
  it('should return -3 for scores 3 and below', () => {
    expect(getModifier(3)).toBe(-3);
    expect(getModifier(1)).toBe(-3);
  });

  it('should return -2 for scores 4-5', () => {
    expect(getModifier(4)).toBe(-2);
    expect(getModifier(5)).toBe(-2);
  });

  it('should return -1 for scores 6-8', () => {
    expect(getModifier(6)).toBe(-1);
    expect(getModifier(7)).toBe(-1);
    expect(getModifier(8)).toBe(-1);
  });

  it('should return 0 for scores 9-12', () => {
    expect(getModifier(9)).toBe(0);
    expect(getModifier(10)).toBe(0);
    expect(getModifier(11)).toBe(0);
    expect(getModifier(12)).toBe(0);
  });

  it('should return +1 for scores 13-15', () => {
    expect(getModifier(13)).toBe(1);
    expect(getModifier(14)).toBe(1);
    expect(getModifier(15)).toBe(1);
  });

  it('should return +2 for scores 16-17', () => {
    expect(getModifier(16)).toBe(2);
    expect(getModifier(17)).toBe(2);
  });

  it('should return +3 for scores 18 and above', () => {
    expect(getModifier(18)).toBe(3);
    expect(getModifier(19)).toBe(3);
    expect(getModifier(20)).toBe(3);
  });
});

describe('formatModifier', () => {
  it('should format positive modifiers with + sign', () => {
    expect(formatModifier(1)).toBe('+1');
    expect(formatModifier(2)).toBe('+2');
    expect(formatModifier(3)).toBe('+3');
  });

  it('should format zero with + sign', () => {
    expect(formatModifier(0)).toBe('+0');
  });

  it('should format negative modifiers without extra sign', () => {
    expect(formatModifier(-1)).toBe('-1');
    expect(formatModifier(-2)).toBe('-2');
    expect(formatModifier(-3)).toBe('-3');
  });
});

describe('LEVEL_1_SAVES', () => {
  it('should have saves defined for all OSE classes', () => {
    const allClasses = Object.values(OSEClass);

    allClasses.forEach((oseClass) => {
      expect(LEVEL_1_SAVES[oseClass]).toBeDefined();
      expect(LEVEL_1_SAVES[oseClass]).toHaveProperty('death');
      expect(LEVEL_1_SAVES[oseClass]).toHaveProperty('wands');
      expect(LEVEL_1_SAVES[oseClass]).toHaveProperty('paralysis');
      expect(LEVEL_1_SAVES[oseClass]).toHaveProperty('breath');
      expect(LEVEL_1_SAVES[oseClass]).toHaveProperty('spells');
    });
  });

  it('should have correct saves for Fighter class', () => {
    expect(LEVEL_1_SAVES[OSEClass.Fighter]).toEqual({
      death: 12,
      wands: 13,
      paralysis: 14,
      breath: 15,
      spells: 16,
    });
  });

  it('should have Dwarves and Halflings with the same saves', () => {
    expect(LEVEL_1_SAVES[OSEClass.Dwarf]).toEqual(LEVEL_1_SAVES[OSEClass.Halfling]);
  });

  it('should have Thieves and Magic-Users with the same saves', () => {
    expect(LEVEL_1_SAVES[OSEClass.Thief]).toEqual(LEVEL_1_SAVES[OSEClass.MagicUser]);
  });
});
