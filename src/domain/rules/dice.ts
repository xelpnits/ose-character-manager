/**
 * Dice parsing and rolling utilities for OSE.
 *
 * Supports standard dice notation: XdY+Z, XdY-Z, XdY
 * Examples: "1d6", "2d8+3", "1d4-1", "3d6"
 */

export interface DiceRoll {
  count: number;     // Number of dice
  sides: number;     // Sides per die
  modifier: number;  // Flat modifier (+/-)
}

export interface RollResult {
  dice: DiceRoll;
  rolls: number[];   // Individual die results
  total: number;     // Sum of rolls + modifier
  formula: string;   // Original formula string
}

/**
 * Parse a dice notation string into a DiceRoll object.
 *
 * @param notation - Dice notation like "1d6", "2d8+3", "1d4-1"
 * @returns DiceRoll object or null if invalid
 */
export function parseDice(notation: string): DiceRoll | null {
  if (!notation || typeof notation !== 'string') return null;

  // Normalize: trim, lowercase, remove spaces
  const clean = notation.trim().toLowerCase().replace(/\s+/g, '');

  // Pattern: (count)d(sides)(+/-modifier)?
  const match = clean.match(/^(\d*)d(\d+)([+-]\d+)?$/);

  if (!match) return null;

  const [, countStr, sidesStr, modStr] = match;

  const count = countStr ? parseInt(countStr, 10) : 1;
  const sides = parseInt(sidesStr, 10);
  const modifier = modStr ? parseInt(modStr, 10) : 0;

  // Validate ranges
  if (count < 1 || count > 100) return null;
  if (sides < 1 || sides > 1000) return null;

  return { count, sides, modifier };
}

/**
 * Roll a single die with the given number of sides.
 */
export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

/**
 * Roll dice based on a DiceRoll specification.
 *
 * @param dice - DiceRoll object
 * @returns RollResult with individual rolls and total
 */
export function rollDice(dice: DiceRoll): RollResult {
  const rolls: number[] = [];

  for (let i = 0; i < dice.count; i++) {
    rolls.push(rollDie(dice.sides));
  }

  const sum = rolls.reduce((acc, r) => acc + r, 0);
  const total = sum + dice.modifier;

  // Format the formula
  let formula = `${dice.count}d${dice.sides}`;
  if (dice.modifier > 0) formula += `+${dice.modifier}`;
  else if (dice.modifier < 0) formula += `${dice.modifier}`;

  return {
    dice,
    rolls,
    total,
    formula,
  };
}

/**
 * Parse and roll a dice notation string.
 *
 * @param notation - Dice notation like "2d6+3"
 * @returns RollResult or null if invalid notation
 */
export function parseAndRoll(notation: string): RollResult | null {
  const dice = parseDice(notation);
  if (!dice) return null;
  return rollDice(dice);
}

/**
 * Roll a d20.
 */
export function rollD20(): number {
  return rollDie(20);
}

/**
 * Format a roll result for display.
 *
 * @param result - The RollResult to format
 * @param showBreakdown - Whether to show individual die rolls
 * @returns Formatted string like "2d6+3 = [4, 2] + 3 = 9"
 */
export function formatRollResult(result: RollResult, showBreakdown = true): string {
  if (!showBreakdown) {
    return `${result.formula} = ${result.total}`;
  }

  const rollsStr = result.rolls.length > 1
    ? `[${result.rolls.join(', ')}]`
    : `${result.rolls[0]}`;

  if (result.dice.modifier === 0) {
    return `${result.formula} = ${rollsStr} = ${result.total}`;
  }

  const modStr = result.dice.modifier > 0
    ? `+ ${result.dice.modifier}`
    : `- ${Math.abs(result.dice.modifier)}`;

  return `${result.formula} = ${rollsStr} ${modStr} = ${result.total}`;
}

/**
 * Validate a dice notation string.
 */
export function isValidDiceNotation(notation: string): boolean {
  return parseDice(notation) !== null;
}
