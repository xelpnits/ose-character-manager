import { describe, it, expect } from 'vitest';
import {
  parseDice,
  rollDice,
  parseAndRoll,
  isValidDiceNotation,
  formatRollResult,
} from './dice';

describe('dice', () => {
  describe('parseDice', () => {
    it('parses basic dice notation', () => {
      expect(parseDice('1d6')).toEqual({ count: 1, sides: 6, modifier: 0 });
      expect(parseDice('2d8')).toEqual({ count: 2, sides: 8, modifier: 0 });
      expect(parseDice('d20')).toEqual({ count: 1, sides: 20, modifier: 0 });
    });

    it('parses dice with positive modifier', () => {
      expect(parseDice('1d6+3')).toEqual({ count: 1, sides: 6, modifier: 3 });
      expect(parseDice('2d8+1')).toEqual({ count: 2, sides: 8, modifier: 1 });
    });

    it('parses dice with negative modifier', () => {
      expect(parseDice('1d6-1')).toEqual({ count: 1, sides: 6, modifier: -1 });
      expect(parseDice('2d4-2')).toEqual({ count: 2, sides: 4, modifier: -2 });
    });

    it('handles whitespace', () => {
      expect(parseDice('  1d6  ')).toEqual({ count: 1, sides: 6, modifier: 0 });
      expect(parseDice(' 2d8+3 ')).toEqual({ count: 2, sides: 8, modifier: 3 });
    });

    it('handles case insensitivity', () => {
      expect(parseDice('1D6')).toEqual({ count: 1, sides: 6, modifier: 0 });
      expect(parseDice('2D8+3')).toEqual({ count: 2, sides: 8, modifier: 3 });
    });

    it('returns null for invalid notation', () => {
      expect(parseDice('')).toBeNull();
      expect(parseDice('invalid')).toBeNull();
      expect(parseDice('d')).toBeNull();
      expect(parseDice('1d')).toBeNull();
      expect(parseDice('d+3')).toBeNull();
    });

    it('rejects out of range values', () => {
      expect(parseDice('0d6')).toBeNull(); // 0 dice
      expect(parseDice('101d6')).toBeNull(); // Too many dice
    });
  });

  describe('rollDice', () => {
    it('rolls correct number of dice', () => {
      const result = rollDice({ count: 3, sides: 6, modifier: 0 });
      expect(result.rolls).toHaveLength(3);
    });

    it('respects dice sides', () => {
      const result = rollDice({ count: 10, sides: 4, modifier: 0 });
      for (const roll of result.rolls) {
        expect(roll).toBeGreaterThanOrEqual(1);
        expect(roll).toBeLessThanOrEqual(4);
      }
    });

    it('applies modifier correctly', () => {
      const result = rollDice({ count: 1, sides: 1, modifier: 5 });
      // 1d1 always rolls 1, so total should be 1 + 5 = 6
      expect(result.total).toBe(6);
    });

    it('formats formula correctly', () => {
      expect(rollDice({ count: 2, sides: 6, modifier: 0 }).formula).toBe('2d6');
      expect(rollDice({ count: 1, sides: 8, modifier: 3 }).formula).toBe('1d8+3');
      expect(rollDice({ count: 1, sides: 4, modifier: -1 }).formula).toBe('1d4-1');
    });
  });

  describe('parseAndRoll', () => {
    it('parses and rolls in one call', () => {
      const result = parseAndRoll('1d6');
      expect(result).not.toBeNull();
      expect(result!.rolls).toHaveLength(1);
      expect(result!.rolls[0]).toBeGreaterThanOrEqual(1);
      expect(result!.rolls[0]).toBeLessThanOrEqual(6);
    });

    it('returns null for invalid notation', () => {
      expect(parseAndRoll('invalid')).toBeNull();
    });
  });

  describe('isValidDiceNotation', () => {
    it('validates correct notation', () => {
      expect(isValidDiceNotation('1d6')).toBe(true);
      expect(isValidDiceNotation('2d8+3')).toBe(true);
      expect(isValidDiceNotation('d20')).toBe(true);
    });

    it('rejects invalid notation', () => {
      expect(isValidDiceNotation('')).toBe(false);
      expect(isValidDiceNotation('abc')).toBe(false);
    });
  });

  describe('formatRollResult', () => {
    it('formats single die roll', () => {
      const result = {
        dice: { count: 1, sides: 6, modifier: 0 },
        rolls: [4],
        total: 4,
        formula: '1d6',
      };
      expect(formatRollResult(result)).toBe('1d6 = 4 = 4');
    });

    it('formats multiple dice', () => {
      const result = {
        dice: { count: 2, sides: 6, modifier: 0 },
        rolls: [3, 4],
        total: 7,
        formula: '2d6',
      };
      expect(formatRollResult(result)).toBe('2d6 = [3, 4] = 7');
    });

    it('formats with positive modifier', () => {
      const result = {
        dice: { count: 1, sides: 6, modifier: 3 },
        rolls: [4],
        total: 7,
        formula: '1d6+3',
      };
      expect(formatRollResult(result)).toBe('1d6+3 = 4 + 3 = 7');
    });

    it('formats with negative modifier', () => {
      const result = {
        dice: { count: 1, sides: 6, modifier: -1 },
        rolls: [4],
        total: 3,
        formula: '1d6-1',
      };
      expect(formatRollResult(result)).toBe('1d6-1 = 4 - 1 = 3');
    });

    it('formats without breakdown when requested', () => {
      const result = {
        dice: { count: 2, sides: 6, modifier: 3 },
        rolls: [3, 4],
        total: 10,
        formula: '2d6+3',
      };
      expect(formatRollResult(result, false)).toBe('2d6+3 = 10');
    });
  });
});
