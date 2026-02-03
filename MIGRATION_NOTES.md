# Migration Notes

## v1.1.0 - Migration and Validation Fixes (2026-02-03)

### Critical Fix: Temporary Ability Modifiers

**Problem:** The migration logic was incorrectly merging temporary ability modifiers (`abilityModifiers`) into base ability scores (`abilities`). This caused spell buffs and temporary bonuses to become permanent.

**Example of the bug:**
```javascript
// Before fix: If a character had STR 14 and a +2 STR buff from a spell
// The migration would produce:
{
  abilities: { STR: 16, ... },      // Wrong! 14 + 2 = 16 became permanent
  abilityModifiers: { STR: 0, ... } // Buff was reset to 0
}

// After fix: Modifiers are preserved separately
{
  abilities: { STR: 14, ... },      // Base remains 14
  abilityModifiers: { STR: 2, ... } // Buff is preserved
}
```

**Regression Test (manual):**
```javascript
// Test case: Import a character with temporary buffs
const testCharacter = {
  id: "test-1",
  name: "Buffed Fighter",
  class: "Fighter",
  level: 1,
  alignment: "Neutral",
  abilities: { STR: 14, INT: 10, WIS: 10, DEX: 12, CON: 14, CHA: 10 },
  abilityModifiers: { STR: 2, INT: 0, WIS: 0, DEX: 1, CON: 0, CHA: 0 }, // +2 STR, +1 DEX buff
  hp: 8, maxHp: 8, ac: 5,
  savingThrows: { death: 12, wands: 13, paralysis: 14, breath: 15, spells: 16 },
  containers: [], xp: 0
};

// After migration:
// - abilities.STR should be 14 (NOT 16)
// - abilityModifiers.STR should be 2 (NOT 0)
// - abilities.DEX should be 12 (NOT 13)
// - abilityModifiers.DEX should be 1 (NOT 0)
```

### Zod Validation Schema Completion

**Problem:** The import validation schema was stripping the following fields:
- `tempHp` - Temporary hit points
- `acModifier` - Temporary AC bonus
- `saveModifiers` - Temporary save bonuses
- `abilityModifiers` - Temporary ability score modifiers
- `title` - Character title
- `type` on containers - Container type enum

**Fix:** All fields are now explicitly defined in the schema. Unknown fields are still stripped (Zod's default) to ensure type safety.

**Design Decision:** We chose to STRIP unknown fields rather than preserve them. This ensures imported data conforms to our type expectations and prevents corrupt data from entering the system. If future versions need to preserve unknown fields for forward-compatibility, use `.passthrough()` on the schema.

### useEffect Dependencies Fix (CharacterEditor.tsx)

**Problem:** The auto-save effect at lines ~50-58 referenced `character` and `onUpdate` without including them in the dependency array, creating stale closure risks.

**Fix:** Used refs (`characterRef`, `onUpdateRef`) to access current values without triggering re-runs. The effect now only runs when `character.class` or `character.level` actually changes, but always has access to the latest `character` object for the update.

### Dead Code Removal

**Removed:**
- `transferItemAtomic()` function from `inventory.ts` - was defined but never called
- `findSourceItem()` helper function - only used by transferItemAtomic
- `getTargetList()` helper function - only used by transferItemAtomic
- Duplicate `WorldState` interface from `inventory.ts` - canonical version is in `domain/models/world.ts`

### Files Changed

1. `src/state/migrations.ts` - Fixed ability modifier migration
2. `src/domain/validation.ts` - Complete Zod schema
3. `src/ui/components/CharacterEditor.tsx` - Fixed useEffect stale closures
4. `src/domain/inventory.ts` - Removed dead code, deduplicated WorldState

---

## Testing Checklist

- [ ] Import a backup file with temporary modifiers - verify they're preserved
- [ ] Create a new character, add temp HP and AC modifiers, reload page - verify they persist
- [ ] Change a level 1 character's class - verify saves auto-update correctly
- [ ] Export and re-import - verify all fields roundtrip correctly
- [ ] Build completes without TypeScript errors
