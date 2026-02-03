import { z } from 'zod';
import { ItemCategory, OSEClass, Alignment } from '../types';

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
});

const ContainerSchema = z.object({
  id: z.string(),
  name: z.string(),
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

const CharacterSchema = z.object({
  id: z.string(),
  name: z.string(),
  class: z.nativeEnum(OSEClass).or(z.string()),
  level: z.number(),
  alignment: z.nativeEnum(Alignment).or(z.string()),
  abilities: AbilitySchema,
  hp: z.number(),
  maxHp: z.number(),
  ac: z.number(),
  savingThrows: SavesSchema,
  backstory: z.string().optional(),
  containers: z.array(ContainerSchema),
  xp: z.number(),
});

export const ExportSchema = z.object({
  version: z.number().optional(),
  characters: z.array(CharacterSchema),
  bank: z.array(ItemSchema),
});

export type ExportData = z.infer<typeof ExportSchema>;