import { AbilityScore, Character } from '../types';

/**
 * Best-effort migration for legacy saved/imported character JSON.
 */
export function migrateCharacter(raw: any): Character {
  return {
    ...raw,
    // 1) Container types
    containers: (raw?.containers ?? []).map((cont: any) => ({
      ...cont,
      type: cont.type || (cont.isFixed ? 'equipped' : 'carried'),
    })),
    // 2) Temp stats
    tempHp: raw?.tempHp || 0,
    acModifier: raw?.acModifier || 0,
    // 3) Modifier objects
    abilityModifiers: raw?.abilityModifiers || {
      [AbilityScore.STR]: 0,
      [AbilityScore.INT]: 0,
      [AbilityScore.WIS]: 0,
      [AbilityScore.DEX]: 0,
      [AbilityScore.CON]: 0,
      [AbilityScore.CHA]: 0,
    },
    saveModifiers: raw?.saveModifiers || {
      death: 0,
      wands: 0,
      paralysis: 0,
      breath: 0,
      spells: 0,
    },
  } as Character;
}

export function migrateCharacters(rawChars: any): Character[] {
  if (!Array.isArray(rawChars)) return [];
  return rawChars.map(migrateCharacter);
}
