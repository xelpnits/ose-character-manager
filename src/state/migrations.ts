import { AbilityScore, Character } from '../types';

/**
 * Default temporary ability modifiers (all zeros).
 */
const DEFAULT_ABILITY_MODS: Record<AbilityScore, number> = {
  [AbilityScore.STR]: 0,
  [AbilityScore.INT]: 0,
  [AbilityScore.WIS]: 0,
  [AbilityScore.DEX]: 0,
  [AbilityScore.CON]: 0,
  [AbilityScore.CHA]: 0,
};

/**
 * Default temporary save modifiers (all zeros).
 */
const DEFAULT_SAVE_MODS = {
  death: 0,
  wands: 0,
  paralysis: 0,
  breath: 0,
  spells: 0,
};

/**
 * Best-effort migration for legacy saved/imported character JSON.
 *
 * IMPORTANT: Temporary modifiers (abilityModifiers, saveModifiers, acModifier, tempHp)
 * are PRESERVED as temporary, NOT merged into base stats. This prevents spell buffs
 * or situational bonuses from becoming permanent.
 */
export function migrateCharacter(raw: any): Character {
  // Base abilities: preserve as-is, defaulting to 10 for missing scores.
  // DO NOT merge abilityModifiers into base - they are temporary buffs.
  const migratedAbilities: Record<AbilityScore, number> = {
    [AbilityScore.STR]: raw?.abilities?.[AbilityScore.STR] ?? 10,
    [AbilityScore.INT]: raw?.abilities?.[AbilityScore.INT] ?? 10,
    [AbilityScore.WIS]: raw?.abilities?.[AbilityScore.WIS] ?? 10,
    [AbilityScore.DEX]: raw?.abilities?.[AbilityScore.DEX] ?? 10,
    [AbilityScore.CON]: raw?.abilities?.[AbilityScore.CON] ?? 10,
    [AbilityScore.CHA]: raw?.abilities?.[AbilityScore.CHA] ?? 10,
  };

  // Preserve existing temporary ability modifiers if present, otherwise default to zeros.
  const existingAbilityMods = raw?.abilityModifiers;
  const migratedAbilityMods: Record<AbilityScore, number> = existingAbilityMods
    ? {
        [AbilityScore.STR]: existingAbilityMods[AbilityScore.STR] ?? 0,
        [AbilityScore.INT]: existingAbilityMods[AbilityScore.INT] ?? 0,
        [AbilityScore.WIS]: existingAbilityMods[AbilityScore.WIS] ?? 0,
        [AbilityScore.DEX]: existingAbilityMods[AbilityScore.DEX] ?? 0,
        [AbilityScore.CON]: existingAbilityMods[AbilityScore.CON] ?? 0,
        [AbilityScore.CHA]: existingAbilityMods[AbilityScore.CHA] ?? 0,
      }
    : { ...DEFAULT_ABILITY_MODS };

  return {
    ...raw,
    // 0) Base abilities (NOT merged with temp modifiers)
    abilities: migratedAbilities,

    // 1) Container types
    containers: (raw?.containers ?? []).map((cont: any) => ({
      ...cont,
      type: cont.type || (cont.isFixed ? 'equipped' : 'carried'),
    })),

    // 2) Temp stats - preserve existing values or default to 0
    tempHp: raw?.tempHp ?? 0,
    acModifier: raw?.acModifier ?? 0,

    // 3) Temporary modifier objects - preserve existing values
    abilityModifiers: migratedAbilityMods,

    saveModifiers: raw?.saveModifiers ?? { ...DEFAULT_SAVE_MODS },
  } as Character;
}

export function migrateCharacters(rawChars: any): Character[] {
  if (!Array.isArray(rawChars)) return [];
  return rawChars.map(migrateCharacter);
}
