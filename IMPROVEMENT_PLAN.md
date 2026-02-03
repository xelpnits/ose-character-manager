# OSE Character Manager - Improvement Plan

This document outlines recommended improvements for the OSE Character Manager application, organized by priority and implementation complexity.

---

## Table of Contents

1. [Critical (P0) - Data Integrity](#critical-p0---data-integrity)
2. [High Priority (P1) - Core Functionality](#high-priority-p1---core-functionality)
3. [Medium Priority (P2) - User Experience](#medium-priority-p2---user-experience)
4. [Low Priority (P3) - Polish & Enhancements](#low-priority-p3---polish--enhancements)
5. [Architectural Improvements](#architectural-improvements)
6. [Testing Strategy](#testing-strategy)
7. [Implementation Roadmap](#implementation-roadmap)

---

## Critical (P0) - Data Integrity

### 1. Add Zod Validation to Bank Items on Import

**Location:** `src/state/persistence.ts:62-64`

**Current Code:**
```typescript
next.bank = json.bank as Item[];  // No validation!
```

**Problem:** Malformed bank items from corrupted or manually-edited export files are silently accepted, potentially corrupting application state.

**Solution:**
```typescript
import { ItemSchema } from '../domain/validation';

// In loadWorld function
if (Array.isArray(json.bank)) {
  next.bank = json.bank
    .map((item: unknown) => {
      const result = ItemSchema.safeParse(item);
      if (result.success) {
        return result.data;
      }
      console.warn('Skipping invalid bank item:', item);
      return null;
    })
    .filter((item): item is Item => item !== null);
}
```

**Files to Modify:**
- `src/state/persistence.ts`
- `src/domain/validation.ts` (ensure ItemSchema is exported)

**Testing:**
- Import file with malformed bank item (missing required field)
- Import file with bank item containing invalid enum value
- Verify valid items are preserved, invalid items are skipped with warning

---

## High Priority (P1) - Core Functionality

### 2. Add React Error Boundary

**Location:** New file `src/ui/components/ErrorBoundary.tsx`

**Problem:** Any unhandled error in a component crashes the entire application with no recovery option.

**Solution:**
```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen bg-arcane-900 flex items-center justify-center p-4">
          <div className="glass-panel rounded-lg p-6 max-w-md text-center">
            <h1 className="text-xl font-serif text-amber-400 mb-4">
              Something went wrong
            </h1>
            <p className="text-arcane-200 mb-4">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-arcane-700 hover:bg-arcane-600 rounded"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Integration in `src/main.tsx`:**
```typescript
import { ErrorBoundary } from './ui/components/ErrorBoundary';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
```

---

### 3. Add Activity Log for Quick Add Items

**Location:** `src/App.tsx:323-343`

**Current Code:**
```typescript
const handleGlobalAddItem = (item: Item) => {
  setBank(prev => [...prev, item]);
  // No activity log entry!
};
```

**Problem:** Items added via Quick Add to the bank don't appear in the activity log, breaking the audit trail.

**Solution:**
```typescript
const handleGlobalAddItem = (item: Item) => {
  setBank(prev => [...prev, item]);
  appendLog(`Added "${item.name}"${item.count > 1 ? ` (×${item.count})` : ''} to Bank`);
};
```

---

### 4. Implement Undo for Character Field Changes

**Location:** `src/ui/components/CharacterEditor.tsx`

**Problem:** Changes to name, class, level, and other character fields cannot be undone, unlike inventory operations.

**Current Pattern:**
```typescript
// Line 226 - no undo support
onUpdate({ name: newName });
```

**Solution:** Add `onUpdateUndoable` prop and use it for significant changes:

```typescript
// In CharacterEditor props
interface Props {
  character: Character;
  onUpdate: (updates: Partial<Character>) => void;
  onUpdateUndoable: (updates: Partial<Character>, message: string) => void;
  // ...
}

// Usage for significant changes
const handleClassChange = (newClass: OSEClass) => {
  onUpdateUndoable(
    { class: newClass },
    `Changed ${character.name}'s class to ${OSEClassLabels[newClass]}`
  );
};

const handleNameChange = (newName: string) => {
  if (newName !== character.name) {
    onUpdateUndoable(
      { name: newName },
      `Renamed character from "${character.name}" to "${newName}"`
    );
  }
};
```

**In App.tsx, add handler:**
```typescript
const handleUpdateCharacterUndoable = useCallback(
  (id: string, updates: Partial<Character>, message: string) => {
    runUndoable(() => {
      updateCharacter(id, updates);
    }, message);
  },
  [updateCharacter, runUndoable]
);
```

**Fields that should support undo:**
- `name`
- `class`
- `level`
- `alignment`
- `maxHp`
- `backstory`

**Fields that should NOT have undo (frequent micro-changes):**
- `hp` (current)
- `tempHp`
- `xp`
- Ability score adjustments via +/- buttons

---

### 5. Improve Toast Queue for Rapid Actions

**Location:** `src/App.tsx:40-49`

**Problem:** When multiple undoable actions happen rapidly, only the most recent toast is shown, causing earlier undo opportunities to be lost.

**Solution:** Implement a proper toast queue with stacking:

```typescript
interface ToastItem {
  id: string;
  message: string;
  onUndo?: () => void;
  timestamp: number;
}

const [toastQueue, setToastQueue] = useState<ToastItem[]>([]);
const TOAST_DURATION = 5000;
const MAX_TOASTS = 3;

const showToast = useCallback((message: string, onUndo?: () => void) => {
  const id = crypto.randomUUID();
  setToastQueue(prev => {
    const next = [...prev, { id, message, onUndo, timestamp: Date.now() }];
    // Keep only the most recent MAX_TOASTS
    return next.slice(-MAX_TOASTS);
  });

  // Auto-dismiss after duration
  setTimeout(() => {
    setToastQueue(prev => prev.filter(t => t.id !== id));
  }, TOAST_DURATION);
}, []);

const dismissToast = useCallback((id: string) => {
  setToastQueue(prev => prev.filter(t => t.id !== id));
}, []);
```

**Update Toast component to render multiple:**
```tsx
<div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
  {toastQueue.map(toast => (
    <Toast
      key={toast.id}
      message={toast.message}
      onUndo={toast.onUndo}
      onDismiss={() => dismissToast(toast.id)}
    />
  ))}
</div>
```

---

## Medium Priority (P2) - User Experience

### 6. Replace JSON Clone with structuredClone

**Location:** `src/App.tsx:183-184`

**Current Code:**
```typescript
const nextCharacters = JSON.parse(JSON.stringify(charactersRef.current));
const nextBank = JSON.parse(JSON.stringify(bankRef.current));
```

**Problem:** `JSON.parse(JSON.stringify())` is less explicit and slightly slower than `structuredClone()`.

**Solution:**
```typescript
const nextCharacters = structuredClone(charactersRef.current);
const nextBank = structuredClone(bankRef.current);
```

**Note:** `structuredClone` is available in all modern browsers and Node.js 17+.

---

### 7. Add Container Name Validation

**Location:** `src/ui/components/InventoryManager.tsx`

**Problem:** Container names can be set to empty strings or whitespace-only values.

**Solution:**
```typescript
const handleContainerNameChange = (containerId: string, newName: string) => {
  const trimmedName = newName.trim();
  if (!trimmedName) {
    // Show error or revert to previous name
    return;
  }
  if (trimmedName.length > 30) {
    // Truncate or show error
    return;
  }
  // Proceed with update
  onUpdateContainer(containerId, { name: trimmedName });
};
```

**Add visual feedback:**
```tsx
<input
  value={containerName}
  onChange={(e) => setContainerName(e.target.value)}
  onBlur={() => handleContainerNameChange(container.id, containerName)}
  className={cn(
    "bg-transparent border-b",
    !containerName.trim() && "border-red-500"
  )}
  placeholder="Container name required"
/>
```

---

### 8. Add Enter Key Confirmation to Dialogs

**Location:** Multiple modal components

**Problem:** Most dialogs only support Escape to close, not Enter to confirm.

**Solution pattern for all dialogs:**
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      // Prevent if focus is on a textarea or specific input
      const target = e.target as HTMLElement;
      if (target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        onConfirm();
      }
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [onClose, onConfirm]);
```

**Apply to:**
- `ConfirmDialog.tsx`
- `XPCalculatorModal.tsx` (for calculate button)
- `StackSplitDialog.tsx`
- Item edit forms in `InventoryManager.tsx`

---

### 9. Add Focus-Visible Styles

**Location:** `src/index.css`

**Problem:** Many interactive elements lack visible focus indicators, hurting keyboard navigation.

**Solution - Add to index.css:**
```css
/* Focus visible styles for accessibility */
button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible,
[role="button"]:focus-visible,
[role="menuitem"]:focus-visible {
  outline: 2px solid theme('colors.amber.400');
  outline-offset: 2px;
}

/* Remove default outline since we're using custom */
button:focus,
input:focus,
select:focus,
textarea:focus {
  outline: none;
}

/* Ensure focus-visible still shows */
button:focus:not(:focus-visible),
input:focus:not(:focus-visible) {
  outline: none;
}
```

---

### 10. Add Loading State on Initial Load

**Location:** `src/App.tsx` and `src/state/useWorldState.ts`

**Problem:** App shows blank/flash of content while loading from localStorage.

**Current:** `isLoaded` state exists in useWorldState but isn't exposed or used.

**Solution:**

In `useWorldState.ts`, expose `isLoaded`:
```typescript
return {
  // ... existing returns
  isLoaded,
};
```

In `App.tsx`:
```tsx
const { isLoaded, /* ... */ } = useWorldState();

if (!isLoaded) {
  return (
    <div className="min-h-screen bg-arcane-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-arcane-300">Loading characters...</p>
      </div>
    </div>
  );
}

return (
  // ... rest of app
);
```

---

### 11. Improve Context Menu Viewport Handling

**Location:** `src/ui/components/InventoryManager.tsx:81-97`

**Problem:** Context menu uses hardcoded margins (240, 300) that may not work for all screen sizes.

**Solution:**
```typescript
useLayoutEffect(() => {
  if (!menuRef.current || !contextMenu) return;

  const menu = menuRef.current;
  const rect = menu.getBoundingClientRect();
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  let { x, y } = contextMenu.position;

  // Adjust horizontal position
  if (x + rect.width > viewport.width - 16) {
    x = viewport.width - rect.width - 16;
  }
  x = Math.max(16, x);

  // Adjust vertical position
  if (y + rect.height > viewport.height - 16) {
    y = viewport.height - rect.height - 16;
  }
  y = Math.max(16, y);

  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
}, [contextMenu]);
```

---

## Low Priority (P3) - Polish & Enhancements

### 12. Add Keyboard Shortcuts

**Location:** New file `src/hooks/useKeyboardShortcuts.ts`

**Shortcuts to implement:**
| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Trigger undo (if available) |
| `Ctrl+S` | Force save (with visual feedback) |
| `Ctrl+E` | Export backup |
| `Escape` | Close any open modal |
| `N` | New character (when no modal open) |

**Implementation:**
```typescript
import { useEffect, useCallback } from 'react';

interface ShortcutHandlers {
  onUndo?: () => void;
  onSave?: () => void;
  onExport?: () => void;
  onNewCharacter?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger if user is typing in an input
    const target = e.target as HTMLElement;
    const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);

    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'z':
          if (!e.shiftKey && handlers.onUndo) {
            e.preventDefault();
            handlers.onUndo();
          }
          break;
        case 's':
          if (handlers.onSave) {
            e.preventDefault();
            handlers.onSave();
          }
          break;
        case 'e':
          if (handlers.onExport) {
            e.preventDefault();
            handlers.onExport();
          }
          break;
      }
    } else if (!isTyping) {
      switch (e.key.toLowerCase()) {
        case 'n':
          if (handlers.onNewCharacter) {
            e.preventDefault();
            handlers.onNewCharacter();
          }
          break;
      }
    }
  }, [handlers]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
```

---

### 13. Split Large Components

**Target files:**
- `CharacterEditor.tsx` (657 lines) → Extract:
  - `CharacterHeader.tsx` (name, class, level, alignment)
  - `AbilityScoresPanel.tsx`
  - `SavingThrowsPanel.tsx`
  - `CombatStatsPanel.tsx` (HP, AC, temp modifiers)
  - `BackstoryPanel.tsx`

- `InventoryManager.tsx` (994 lines) → Extract:
  - `ContainerCard.tsx`
  - `ItemCard.tsx`
  - `ItemEditForm.tsx`
  - `InventoryContextMenu.tsx`
  - `QuickAddItem.tsx`

**Benefits:**
- Easier to test individual components
- Reduces re-render scope
- Improves code navigation
- Enables `React.memo` optimization per component

---

### 14. Add Memoization to Character List

**Location:** `src/ui/components/CharacterList.tsx`

**Problem:** All character cards re-render when any character changes.

**Solution:**
```typescript
const CharacterCard = React.memo<CharacterCardProps>(({
  character,
  onSelect,
  onDelete
}) => {
  // ... existing component code
});

// Add comparison function if needed
const CharacterCard = React.memo<CharacterCardProps>(
  ({ character, onSelect, onDelete }) => { /* ... */ },
  (prev, next) => prev.character.id === next.character.id
    && prev.character.name === next.character.name
    && prev.character.level === next.character.level
    && prev.character.class === next.character.class
);
```

---

### 15. Activity Log Auto-Scroll

**Location:** `src/ui/components/ActivityLogModal.tsx`

**Problem:** New entries appear at top, but user may want to see latest activity.

**Solution:** Add toggle for sort order and auto-scroll:
```typescript
const [sortNewestFirst, setSortNewestFirst] = useState(true);
const listRef = useRef<HTMLDivElement>(null);

const sortedLog = useMemo(() => {
  const sorted = [...activityLog].sort((a, b) =>
    sortNewestFirst
      ? b.timestamp - a.timestamp
      : a.timestamp - b.timestamp
  );
  return sorted;
}, [activityLog, sortNewestFirst]);

// Auto-scroll when new entry added (if scrolled to top/bottom)
useEffect(() => {
  if (listRef.current) {
    if (sortNewestFirst) {
      listRef.current.scrollTop = 0;
    } else {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }
}, [activityLog.length, sortNewestFirst]);
```

---

## Architectural Improvements

### A1. Add Test Framework

**Recommended:** Vitest (integrates natively with Vite)

**Setup:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**vite.config.ts:**
```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

**Priority test files:**
1. `src/domain/inventory.test.ts` - Item stacking rules
2. `src/domain/rules/modifiers.test.ts` - Ability modifier calculations
3. `src/domain/validation.test.ts` - Zod schema validation
4. `src/state/migrations.test.ts` - Data migration correctness

---

### A2. Add CI/CD Pipeline

**File:** `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npx tsc --noEmit

      - name: Lint
        run: npm run lint

      - name: Test
        run: npm test

      - name: Build
        run: npm run build
```

---

### A3. Add ESLint Configuration

**Install:**
```bash
npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-react-hooks
```

**eslint.config.js:**
```javascript
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
];
```

---

## Testing Strategy

### Unit Tests (Domain Logic)

| File | Test Cases |
|------|------------|
| `inventory.ts` | `areItemsStackable` with matching/non-matching items |
| `modifiers.ts` | `getModifier` for all ability score ranges |
| `weight.ts` | Weight calculations with various container configurations |
| `validation.ts` | Valid/invalid character, item, container schemas |
| `migrations.ts` | Migration preserves temp modifiers, handles missing fields |

### Integration Tests (State)

| Hook/Function | Test Cases |
|---------------|------------|
| `useWorldState` | Autosave triggers, undo restores state |
| `persistence` | Export/import roundtrip, handles corrupted data |

### Component Tests (UI)

| Component | Test Cases |
|-----------|------------|
| `CommitNumberInput` | Commits on blur, Enter; cancels on Escape |
| `StatInput` | Increment/decrement with bounds |
| `ConfirmDialog` | Focus management, keyboard navigation |
| `Toast` | Shows message, undo callback, auto-dismiss |

---

## Implementation Roadmap

### Phase 1: Stability (1-2 days)
- [ ] P0: Bank item validation
- [ ] P1: Error boundary
- [ ] P1: Activity log for Quick Add

### Phase 2: Undo & Feedback (2-3 days)
- [ ] P1: Undo for character changes
- [ ] P1: Toast queue improvements
- [ ] P2: Loading state

### Phase 3: Accessibility (1-2 days)
- [ ] P2: Focus-visible styles
- [ ] P2: Enter key confirmation
- [ ] P2: Context menu positioning

### Phase 4: Code Quality (2-3 days)
- [ ] P2: Replace JSON clone with structuredClone
- [ ] P2: Container name validation
- [ ] P3: Split large components
- [ ] P3: Add memoization

### Phase 5: Developer Experience (2-3 days)
- [ ] A1: Add Vitest and initial tests
- [ ] A2: Set up CI/CD pipeline
- [ ] A3: Add ESLint configuration

### Phase 6: Polish (1-2 days)
- [ ] P3: Keyboard shortcuts
- [ ] P3: Activity log improvements

---

## Summary

| Priority | Count | Effort Estimate |
|----------|-------|-----------------|
| P0 (Critical) | 1 | 0.5 days |
| P1 (High) | 4 | 2-3 days |
| P2 (Medium) | 6 | 2-3 days |
| P3 (Low) | 4 | 2-3 days |
| Architectural | 3 | 2-3 days |

**Total estimated effort:** 9-13 days for complete implementation

**Recommended minimum viable improvements:**
1. Bank item validation (P0)
2. Error boundary (P1)
3. Activity log for Quick Add (P1)
4. Focus-visible styles (P2)
5. Loading state (P2)

These five changes address the most critical issues with approximately 2-3 days of effort.
