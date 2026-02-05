import { z } from 'zod';
import { ItemCategory, OSEClass, Alignment } from '../types';

/**
 * Zod validation schemas for OSE Character Manager data.
 *
 * DESIGN DECISION: Unknown fields are STRIPPED by default (Zod's default behavior).
 * This ensures imported data conforms to our type expectations.
 * If you need to preserve unknown fields, use `.passthrough()` on the schema.
 *
 * All optional temporal/modifier fields are explicitly defined to ensure they survive
 * import/export roundtrips without being stripped.
 */

const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  count: z.number().min(1),
  weight: z.number(),
  description: z.string().optional(),
  category: z.nativeEnum(ItemCategory).optional().or(z.string().optional()), // Loose parsing for imports
  damage: z.string().optional(),
  armor: z.number().optional(),
  charges: z.number().optional(),
  maxCharges: z.number().optional(),
  isEquipped: z.boolean().optional(),
  isMagical: z.boolean().optional(),
  isUnidentified: z.boolean().optional(),
  goldValue: z.number().optional(),
  isUnclaimed: z.boolean().optional(),
  isRanged: z.boolean().optional(),
});

const SpellSchema = z.object({
  id: z.string(),
  name: z.string(),
  level: z.number().min(1).max(9),
  description: z.string().optional(),
  duration: z.string().optional(),
  range: z.string().optional(),
});

const CombatLogEntrySchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  type: z.enum(['attack', 'damage', 'save']),
  weaponName: z.string(),
  attackRoll: z.number().optional(),
  attackBonus: z.number().optional(),
  attackTotal: z.number().optional(),
  targetAC: z.number().optional(),
  hit: z.boolean().optional(),
  damageRoll: z.string().optional(),
  damageTotal: z.number().optional(),
  notes: z.string().optional(),
});

const ContainerSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['equipped', 'carried', 'stored']).optional(), // ContainerType
  items: z.array(ItemSchema),
  isFixed: z.boolean().optional(),
  maxWeight: z.number().optional(),
});

const AbilitySchema = z.object({
  STR: z.number(),
  INT: z.number(),
  WIS: z.number(),
  DEX: z.number(),
  CON: z.number(),
  CHA: z.number(),
});

const SavesSchema = z.object({
  death: z.number(),
  wands: z.number(),
  paralysis: z.number(),
  breath: z.number(),
  spells: z.number(),
});

// Partial saves schema for temporary modifiers (all fields optional)
const PartialSavesSchema = z.object({
  death: z.number().optional(),
  wands: z.number().optional(),
  paralysis: z.number().optional(),
  breath: z.number().optional(),
  spells: z.number().optional(),
}).optional();

// Ability modifiers schema (all abilities with numeric modifiers)
const AbilityModifiersSchema = z.object({
  STR: z.number(),
  INT: z.number(),
  WIS: z.number(),
  DEX: z.number(),
  CON: z.number(),
  CHA: z.number(),
}).optional();

const CharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  class: z.nativeEnum(OSEClass).or(z.string()),
  level: z.number(),
  alignment: z.nativeEnum(Alignment).or(z.string()),
  title: z.string().optional(), // Character title (e.g., "Veteran", "Swordmaster")

  // Base abilities
  abilities: AbilitySchema,

  // Temporary ability modifiers (spells, effects, etc.)
  abilityModifiers: AbilityModifiersSchema,

  // Combat stats
  hp: z.number(),
  maxHp: z.number(),
  tempHp: z.number().optional(), // Temporary hit points
  ac: z.number(),
  acModifier: z.number().optional(), // Temporary AC bonus (spells, shield spell, etc.)

  // Saving throws
  savingThrows: SavesSchema,
  saveModifiers: PartialSavesSchema, // Temporary save bonuses

  // Other
  backstory: z.string().optional(),
  containers: z.array(ContainerSchema),
  xp: z.number(),

  // Magic
  learnedSpells: z.array(SpellSchema).optional(),

  // Combat Log
  combatLog: z.array(CombatLogEntrySchema).optional(),
});

export const ExportSchema = z.object({
  version: z.number().optional(),
  date: z.string().optional(), // ISO date string from export
  characters: z.array(CharacterSchema),
  bank: z.array(ItemSchema),
});

export type ExportData = z.infer<typeof ExportSchema>;

// Re-export individual schemas for use in validation
export { ItemSchema, ContainerSchema, CharacterSchema };