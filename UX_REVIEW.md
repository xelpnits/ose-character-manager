# OSE Character Manager - UX/Behavior Review

**Reviewer:** Opus (AI Review #2)  
**Date:** 2026-02-03  
**Scope:** User flows, edge cases, and behavior analysis

---

## Summary

The OSE Character Manager is a well-structured React application with thoughtful UX patterns including commit-on-blur inputs, debounced autosave, and undo toasts. However, several issues and improvements were identified, ranging from critical data integrity concerns to minor polish items.

---

## Priority Legend

- **P0 - Critical:** Data loss / corruption risk, blocking bugs
- **P1 - High:** Major UX friction, inconsistent behavior
- **P2 - Medium:** Polish issues, minor inconsistencies
- **P3 - Low:** Nice-to-have improvements

---

## Issues by Priority

### P0 - Critical

#### 1. ❌ `CommitNumberInput` `emptyCommit="zero"` silently converts empty to 0
**Affected:** `CharacterEditor.tsx` (AC Temp Bonus field)  
**Issue:** The AC Temp Bonus uses `emptyCommit="zero"` which means clearing the field commits `0`, not `undefined`. This is correct behavior BUT contradicts the type signature (`onCommit: (value: number | undefined) => void`).

**Current Code:**
```tsx
<CommitNumberInput
  value={character.acModifier ?? 0}
  emptyCommit="zero"
  onCommit={(n) => onUpdate({ ...character, acModifier: n ?? 0 })}
```

**Actual Issue:** The `emptyCommit="zero"` type is actually `EmptyCommitBehavior = 'keep' | 'undefined' | number`. When using a numeric value like `0`, it works fine. However, the JSDoc and API don't clearly communicate this. **Not a bug, but confusing API.**

---

#### 2. ⚠️ Import doesn't validate bank items through Zod
**Affected:** `persistence.ts`  
**Issue:** While `parseImportJson` runs `migrateCharacters()` on characters, bank items are just cast: `next.bank = json.bank as Item[]`. Malformed bank items could corrupt state.

**Risk:** Importing a malformed JSON with invalid bank items silently accepts corrupt data.

**Suggested Fix:**
```typescript
// In parseImportJson()
if (json.bank && Array.isArray(json.bank)) {
  // Validate each item or at minimum sanitize
  next.bank = json.bank.filter((item: any) => 
    item && typeof item.id === 'string' && typeof item.name === 'string'
  ).map((item: any) => ({
    ...item,
    count: Math.max(1, parseInt(item.count) || 1),
    weight: parseInt(item.weight) || 0,
  }));
}
```

---

#### 3. ⚠️ Item transfer doesn't remove from source in CharacterList Global Inventory
**Affected:** `CharacterList.tsx` → `initiateMove()`  
**Issue:** When moving items from Global Inventory view, the `onMoveItem` callback in `App.tsx` handles removal correctly, BUT the local item state `allItems` is derived from `characters` + `bank`, so there's potential for a stale render showing the item in both places momentarily until React re-renders.

**Mitigation:** This is handled by React's state propagation, but could cause confusion if `onMoveItem` fails silently.

---

### P1 - High Priority

#### 4. Toast replaces previous toast immediately (no queue)
**Affected:** `App.tsx` → `Toast.tsx`  
**Issue:** Performing multiple undoable actions rapidly overwrites the previous toast. If a user performs action A, then B quickly, the undo for A is lost.

**Current Behavior:**
```tsx
setToast({
  isOpen: true,
  message,
  // ... previous toast is overwritten
});
```

**Suggested Fix:** Implement a toast queue or extend toast duration reset on new actions:
```tsx
// Option 1: Queue toasts
const [toastQueue, setToastQueue] = useState<ToastItem[]>([]);

// Option 2: At minimum, warn user or extend duration
```

---

#### 5. Activity Log doesn't capture bank item additions from "Quick Add"
**Affected:** `App.tsx` → `handleGlobalAddItem()`  
**Issue:** Adding items via the Global Add modal doesn't call `appendLog()`. Activity is silent.

**Current Code:**
```tsx
const handleGlobalAddItem = useCallback(
  (charId: string, containerId: string, item: Item) => {
    if (charId === BANK_ID) {
      setBank((prev) => [...prev, item]);
    } else {
      // ...
    }
    // ⚠️ Missing: appendLog(`Added "${item.name}" to ${target}.`)
  },
  [setBank, setCharacters]
);
```

**Suggested Fix:**
```tsx
const targetName = charId === BANK_ID ? 'The Bank' : characters.find(c => c.id === charId)?.name;
appendLog(`Added ${item.count}× "${item.name}" to ${targetName}.`);
```

---

#### 6. Undo doesn't work for non-undoable character updates
**Affected:** `CharacterEditor.tsx`  
**Issue:** Most character field changes (name, class, level, HP, abilities) use `onUpdate()` directly, which doesn't create an undo snapshot. Only inventory operations use `onUpdateUndoable()`.

**User Impact:** Accidentally changing a character's level from 5 to 1 has no undo.

**Suggested Fix:** Consider wrapping significant field changes (class, level, HP max) in undoable operations, or provide a "revert all changes since last save" option.

---

#### 7. `CharacterEditor` auto-applies Level 1 saves unconditionally
**Affected:** `CharacterEditor.tsx` lines 41-49  
**Issue:** The `useEffect` that auto-applies saves runs on every class/level change but only checks `character.level === 1`. At higher levels, changing class doesn't update saves at all, which might be intentional but is confusing.

**Current Code:**
```tsx
useEffect(() => {
  if (character.level === 1 && LEVEL_1_SAVES[character.class]) {
    // Only updates at level 1
  }
}, [character.class, character.level]);
```

**Question:** Is this intentional? If a player changes class at level 5, should saves remain unchanged? Consider adding a "Reset to Class Defaults" button.

---

### P2 - Medium Priority

#### 8. StatInput clamp allows values outside displayed range
**Affected:** `StatInput.tsx`  
**Issue:** The `min={MIN_SCORE}` and `max={MAX_SCORE}` on the input are passed to `CommitNumberInput`, but the HTML `number` input allows typing values outside 3-18 before blur. The `transform` function then clamps on commit.

**Current Behavior:** User can type "25", which becomes "18" on blur. Mildly confusing.

**Suggested Fix:** Add visual feedback or live validation:
```tsx
// Option: Show warning while draft is out of range
const isOutOfRange = draft && (Number(draft) < MIN_SCORE || Number(draft) > MAX_SCORE);
```

---

#### 9. StackSplitDialog doesn't reset count when reopened
**Affected:** `StackSplitDialog.tsx`  
**Issue:** The `count` state initializes to `1` but doesn't reset when the dialog opens for a new item. If you split "10 Torches" selecting 5, close, then open for "3 Arrows", count might still be 5 (or 1 from initial state).

**Current Code:**
```tsx
const [count, setCount] = useState<number>(1);
```

**Suggested Fix:**
```tsx
useEffect(() => {
  if (isOpen && item) {
    setCount(Math.min(1, item.count)); // or item.count for "move all" default
  }
}, [isOpen, item]);
```

---

#### 10. Empty container name allows blank input
**Affected:** `InventoryManager.tsx`  
**Issue:** Container name input has no validation. User can clear it and leave it blank.

**Suggested Fix:** Add placeholder text that persists or validate on blur:
```tsx
onBlur={(e) => {
  if (!e.target.value.trim()) {
    handleRenameContainer(container.id, 'Unnamed Container');
  }
}}
```

---

#### 11. Character name input has no max length
**Affected:** `CharacterEditor.tsx`  
**Issue:** The name input in the sticky header has no `maxLength`. Extremely long names break layout.

**Suggested Fix:** Add `maxLength={50}` or similar.

---

#### 12. XP Calculator "Apply" button should show delta
**Affected:** `XPCalculatorModal.tsx`  
**Issue:** The Apply button just says "Apply XP". Would be clearer as "Apply +{delta} XP" to confirm the action.

**Suggested Fix:**
```tsx
<span>Apply +{previewXP - currentXP} XP</span>
```

---

#### 13. Context menu position can go off-screen on small viewports
**Affected:** `InventoryManager.tsx` → `ContextMenu`  
**Issue:** The adjustment logic uses `window.innerWidth - 240` and `window.innerHeight - 300`, but these magic numbers might not account for all content heights. On very small screens or when menu is opened near bottom, it could still overflow.

**Suggested Fix:** Use a ref to measure actual menu height after render, or use a library like `@floating-ui/react`.

---

### P3 - Low Priority (Polish)

#### 14. Dice Roller messages array grows unbounded
**Affected:** `DiceRoller.tsx`  
**Issue:** Unlike `activityLog` which caps at 200 entries, dice roll messages have no limit and persist only in session memory (not localStorage). Not a problem in practice but inconsistent.

---

#### 15. No keyboard shortcut to close modals
**Affected:** All modals  
**Issue:** While `Escape` closes modals (good!), there's no way to confirm with `Enter` in most dialogs (except name input in DiceRoller).

**Suggested Fix:** Add `onKeyDown` handler for Enter to confirm where appropriate.

---

#### 16. Activity Log shows oldest first, scroll position starts at top
**Affected:** `ActivityLogModal.tsx`  
**Issue:** Log is sorted oldest→newest, but modal opens at top. User must scroll to see recent activity.

**Suggested Fix:** Auto-scroll to bottom on open, or reverse sort order (newest first).

---

#### 17. "New Character" containers have hardcoded UUIDs
**Affected:** `App.tsx` → `handleNewCharacter()`  
**Issue:** The initial containers use `crypto.randomUUID()` correctly, but `INITIAL_CHARACTER` in `character.ts` has hardcoded IDs like `'worn'` and `'backpack'`. If two characters were created from INITIAL_CHARACTER without override, they'd share IDs.

**Current Code (App.tsx - correct):**
```tsx
containers: [
  { id: crypto.randomUUID(), name: 'Worn / Belt', ... },
  { id: crypto.randomUUID(), name: 'Backpack', ... },
],
```

This is handled correctly in `handleNewCharacter`, so no actual bug. Just noting the `INITIAL_CHARACTER` constant has static IDs that should never be used directly.

---

#### 18. Temp HP bar width is hardcoded to 10%
**Affected:** `CharacterEditor.tsx`  
**Issue:** The Temp HP visual overlay always shows as `width: '10%'` regardless of actual temp HP amount.

**Current Code:**
```tsx
{character.tempHp > 0 && (
  <div
    className="..."
    style={{ left: `${...}%`, width: '10%' }}  // ← hardcoded
  ></div>
)}
```

**Suggested Fix:** Calculate proportional width or show as separate indicator.

---

#### 19. Item category dropdown uses `appearance-none` but no custom arrow
**Affected:** `InventoryManager.tsx` → `ItemDetailModal`  
**Issue:** Category select has `appearance-none` but relies on the browser's default dropdown behavior. No visual indicator it's a dropdown.

---

#### 20. No loading state shown on initial localStorage load
**Affected:** `useWorldState.ts`  
**Issue:** The `isLoaded` state exists but isn't used in the UI. On slow devices or with large data, there could be a flash of empty state.

---

## Keyboard/Focus Handling Analysis

### ✅ Good Patterns

1. **Modal focus trapping:** All modals properly save `lastActiveRef` and restore focus on close
2. **Escape key handling:** Consistently implemented across all dialogs/modals
3. **Initial focus:** Most modals focus an appropriate element on open
4. **`ConfirmDialog` focus strategy:** Correctly focuses Cancel for dangerous actions, Confirm otherwise

### ⚠️ Issues

1. **No focus visible styles:** Many buttons lack `:focus-visible` ring styles (relies on browser defaults)
2. **StatInput buttons lack focus order:** The +/- buttons and input don't have logical tab order
3. **Context menu not keyboard navigable:** No arrow key navigation between menu items
4. **Item cards not focusable:** Items in inventory can only be clicked, not tabbed to

---

## Export/Import Integrity Analysis

### ✅ Working Correctly

1. Export includes version number and date
2. Import runs migration on characters
3. File input resets after import (same file can be re-imported)

### ⚠️ Concerns

1. **Bank items not validated** (mentioned above)
2. **No checksum/validation** of import file integrity
3. **Alert-based feedback** - import uses `alert()` for success/error, not toast
4. **Activity log not included in export** - could be added for full state backup

---

## Autosave Status Analysis

### ✅ Working Correctly

1. Debounced save (800ms) prevents excessive writes
2. Visual indicator shows saving/saved/error states
3. `beforeunload` handler saves synchronously on tab close
4. Refs ensure latest state is captured even during async operations

### ⚠️ Minor Issues

1. **Error state sticky:** If save fails, status shows "Error" but there's no retry mechanism
2. **No offline detection:** If localStorage is full or unavailable, error handling is minimal

---

## Recommendations Summary

### Must Fix (P0-P1)
1. Add bank item validation on import
2. Implement toast queue or undo stack
3. Add activity log entry for Quick Add items
4. Consider undo for major character field changes

### Should Fix (P2)
1. Reset StackSplitDialog count on open
2. Add container name validation
3. Add character name max length
4. Fix context menu positioning

### Nice to Have (P3)
1. Add keyboard navigation to context menus
2. Auto-scroll activity log to bottom
3. Fix Temp HP bar width calculation
4. Add loading state for initial load

---

## No Critical P0 Bugs Found

After thorough review, no data-corrupting bugs were identified that require immediate patching. The import validation issue (P0 #2) is a risk but requires malformed external data to trigger.

The application is well-architected with proper state management, and the identified issues are primarily UX polish and edge case handling.

---

*Review complete. Run `openclaw gateway wake` to notify.*
