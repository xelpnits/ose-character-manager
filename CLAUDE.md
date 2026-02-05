# CLAUDE.md - OSE Character Manager

## Project Overview

**OSE Character Manager** is a web-based character sheet and inventory manager for the Old School Essentials (OSE) tabletop RPG system. It's a single-page application (SPA) with no backend - all data persists in localStorage.

**Key Features:**
- Multi-character management with auto-save
- Complex inventory system with containers, item stacking, and transfers
- Character sheet editor with ability scores, saving throws, XP tracking
- Activity log for audit trail
- Import/export backup functionality
- Dice roller with chat interface
- Undo functionality for destructive operations

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Production build (outputs to dist/)
npm run build

# Preview production build locally
npm run preview
```

## Technology Stack

| Category | Technology |
|----------|------------|
| Framework | React 19.2 with TypeScript 5.8 |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS (utility-first) |
| Icons | Lucide React |
| Validation | Zod 4.3 |
| State | Custom hooks + localStorage |
| Testing | None (no test framework installed) |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         App.tsx                              │
│  (Root component - orchestrates state and view routing)     │
├─────────────────────────────────────────────────────────────┤
│                    useWorldState() Hook                      │
│  (Characters, Bank, Activity Log, Autosave, Undo)           │
├─────────────────────────────────────────────────────────────┤
│         domain/              │           ui/                 │
│  (Business logic & rules)    │   (React components)         │
├─────────────────────────────────────────────────────────────┤
│                       localStorage                           │
│  (Persistence layer - debounced 800ms autosave)             │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
src/
├── domain/                      # Business logic (no React)
│   ├── models/
│   │   ├── character.ts         # Character, Item, Container types + enums
│   │   ├── world.ts             # WorldState interface, BANK_ID constant
│   │   └── index.ts             # Re-exports
│   ├── rules/
│   │   ├── modifiers.ts         # OSE ability modifier tables, save calculations
│   │   └── weight.ts            # Weight/capacity calculations
│   ├── inventory.ts             # Item stacking rules (areItemsStackable)
│   └── validation.ts            # Zod schemas for import validation
│
├── state/                       # State management
│   ├── useWorldState.ts         # Main state hook (autosave, undo, activity log)
│   ├── persistence.ts           # localStorage I/O, JSON export/import
│   ├── migrations.ts            # Data migration for backward compatibility
│   └── storage.ts               # Constants (DEBOUNCE_DELAY_MS, EXPORT_VERSION)
│
├── ui/                          # React components
│   ├── components/
│   │   ├── CharacterEditor.tsx      # Main character sheet (tabbed UI)
│   │   ├── CharacterList.tsx        # List view + global inventory
│   │   ├── InventoryManager.tsx     # Container/item management
│   │   ├── DiceRoller.tsx           # Dice rolling + chat
│   │   ├── XPCalculatorModal.tsx    # XP calculation modal
│   │   ├── Toast.tsx                # Notification toasts with undo
│   │   ├── ConfirmDialog.tsx        # Confirmation dialogs
│   │   ├── ActivityLogModal.tsx     # Activity audit log
│   │   ├── StackSplitDialog.tsx     # Item quantity selector
│   │   ├── StatInput.tsx            # Ability score input (+/- buttons)
│   │   ├── CommitNumberInput.tsx    # Number input with blur commit
│   │   └── ImportExportControls.tsx # Backup/restore UI
│   ├── labels.ts                # Human-readable labels for enums
│   └── icons.tsx                # Icon helper functions
│
├── App.tsx                      # Root component (state orchestration)
├── main.tsx                     # React DOM mount point
├── index.css                    # Tailwind imports + custom styles
│
└── types.ts                     # Re-exports from domain/models (shim)
```

## Key Domain Models

### Character (`src/domain/models/character.ts`)

```typescript
interface Character {
  id: string
  name: string
  class: OSEClass      // Fighter, MagicUser, Cleric, Thief, Elf, Dwarf, Halfling
  level: number
  alignment: Alignment // Lawful, Neutral, Chaotic

  // Abilities (base + temporary modifiers tracked separately)
  abilities: Record<AbilityScore, number>        // Base scores (3-18)
  abilityModifiers: Record<AbilityScore, number> // Temporary buffs/debuffs

  // Combat stats
  hp: number
  maxHp: number
  tempHp: number      // Temporary hit points
  ac: number          // Armor Class (descending, lower is better)
  acModifier: number  // Temporary AC bonus

  // Saving throws (with optional temp modifiers)
  savingThrows: SavingThrows      // death, wands, paralysis, breath, spells
  saveModifiers: Partial<SavingThrows>

  backstory: string
  containers: Container[]
  xp: number
}
```

### Item & Container

```typescript
interface Item {
  id: string
  name: string
  count: number          // Stack size (minimum 1)
  weight: number         // Per item weight
  category?: ItemCategory // Weapon, Armor, Treasure, Consumable, etc.
  description?: string
  damage?: string        // e.g., "1d8"
  armor?: number         // AC bonus (can be 0)
  charges?: number
  maxCharges?: number
  isEquipped?: boolean
  isMagical?: boolean
  isUnidentified?: boolean
  goldValue?: number
  isUnclaimed?: boolean  // For XP tracking
}

interface Container {
  id: string
  name: string
  type: ContainerType    // 'equipped' | 'carried' | 'stored'
  items: Item[]
  isFixed?: boolean      // Cannot be deleted
  maxWeight?: number     // Capacity limit
}
```

### Enums

```typescript
enum AbilityScore { STR, INT, WIS, DEX, CON, CHA }
enum OSEClass { Fighter, MagicUser, Cleric, Thief, Elf, Dwarf, Halfling }
enum Alignment { Lawful, Neutral, Chaotic }
enum ItemCategory { Weapon, Armor, Treasure, Consumable, Tool, Container, Misc }
enum ContainerType { Equipped = 'equipped', Carried = 'carried', Stored = 'stored' }
```

## State Management Patterns

### useWorldState Hook (`src/state/useWorldState.ts`)

Central hook that manages all application state:

```typescript
const {
  characters,           // Character[]
  bank,                 // Item[] (global shared inventory)
  activityLog,          // ActivityLogEntry[]
  saveStatus,           // 'saving' | 'saved' | 'error'
  updateCharacter,      // (id, updates) => void
  deleteCharacter,      // (id) => void
  addItemToBank,        // (item) => void
  appendLog,            // (message) => void
  exportToJson,         // () => void
  importFromJson,       // (file) => Promise<void>
  // ... more methods
} = useWorldState()
```

### Autosave Mechanism

1. State changes set `saveStatus = 'saving'`
2. 800ms debounce prevents excessive writes
3. After debounce, saves to localStorage
4. `beforeunload` handler forces sync save on tab close

### Undo System

```typescript
// In App.tsx
function runUndoable(action: () => void, message: string) {
  const snapshot = takeWorldSnapshot()  // structuredClone
  action()
  appendLog(message)
  showUndoToast(message, () => restoreWorldSnapshot(snapshot))
}
```

### Refs for Stale Closure Prevention

The codebase uses refs to access current state in effects without triggering re-runs:

```typescript
// Pattern used in CharacterEditor.tsx
const characterRef = useRef(character)
characterRef.current = character

useEffect(() => {
  // Use characterRef.current instead of character
  // to always get the latest value
}, [someOtherDependency])
```

## Code Conventions

### Component Patterns

1. **Functional components with TypeScript FC type:**
   ```typescript
   const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => { ... }
   ```

2. **Controlled inputs with commit-on-blur:**
   - `CommitNumberInput` commits only on blur/Enter, not onChange
   - Prevents excessive re-renders during typing

3. **Modal focus management:**
   - All dialogs use `useRef` to save/restore focus
   - Escape key closes modals consistently

4. **Toast notifications with undo:**
   - Destructive actions show toast with "Undo" button
   - Toast auto-dismisses after timeout

### Styling Conventions

1. **Tailwind utility classes** - no CSS-in-JS
2. **Glass morphism panel style:**
   ```tsx
   <div className="glass-panel rounded-lg p-4">
   ```
3. **Custom color palette:** `arcane-*` (deep blues/indigos) + `amber` accent
4. **Typography:** Inter (sans), Crimson Pro (serif for headers)

### TypeScript Conventions

1. **Strict enums** for domain types
2. **Partial<T>** for optional modifier objects
3. **Zod schemas** for runtime validation on imports
4. **No `any` types** - use proper typing

## Important Implementation Details

### Item Stacking Rules (`src/domain/inventory.ts`)

Items stack if ALL of these match:
- name
- category
- isMagical
- goldValue

### Container Targeting Priority

When adding items, target containers in this order:
1. Container named "Backpack" or "Rucksack"
2. First non-fixed container
3. First available container

### Migration System (`src/state/migrations.ts`)

**Critical:** Never merge temporary modifiers into base stats during migration:
```typescript
// WRONG - destroys temp buffs
abilities: { STR: rawAbilities.STR + rawAbilityModifiers.STR }

// CORRECT - preserve separately
abilities: { STR: rawAbilities.STR }
abilityModifiers: { STR: rawAbilityModifiers.STR }
```

### Saving Throw Auto-Apply

When a Level 1 character's class changes, default saving throws for that class are auto-applied. This only happens at Level 1 to avoid overwriting customized saves.

## localStorage Keys

| Key | Contents |
|-----|----------|
| `ose_character_manager_v1` | Character[] array |
| `ose_bank_v1` | Item[] (bank items) |
| `ose_activity_log_v1` | ActivityLogEntry[] (capped at 200) |
| `ose_username` | Player name for dice roller |

## Common Development Tasks

### Adding a New Character Field

1. Update `Character` interface in `src/domain/models/character.ts`
2. Update Zod schema in `src/domain/validation.ts`
3. Update migration in `src/state/migrations.ts` (set default for old data)
4. Update UI components that display/edit the field

### Adding a New Item Property

1. Update `Item` interface in `src/domain/models/character.ts`
2. Update item Zod schema in `src/domain/validation.ts`
3. Update `areItemsStackable()` if the property affects stacking
4. Update `InventoryManager.tsx` to display/edit the property

### Adding a New Modal

1. Create component in `src/ui/components/`
2. Follow existing pattern (focus management, Escape key, overlay click)
3. Add state in parent component (`isOpen`, `setIsOpen`)
4. Use conditional rendering: `{isModalOpen && <Modal ... />}`

## Known Issues

### P1 (High Priority)
- Toast queue can lose undo capability on rapid actions
- No undo for character field changes (name, level, class)

### P2 (Medium Priority)
- Character name has no max length
- StatInput allows typing values outside 3-18 range

### P3 (Low Priority)
- Minimal keyboard shortcuts
- Activity log doesn't auto-scroll to bottom

## Build & Deployment

**Build command:**
```bash
npm run build
```

**Output:** `dist/` directory (static files)

**Deployment:** Any static hosting (Vercel, Netlify, GitHub Pages, S3, etc.)

**CI:** GitHub Actions (`.github/workflows/ci.yml`) runs typecheck, lint, tests, and build on PRs

## Testing Notes

**Test framework:** Vitest with jsdom environment. Run tests with:
```bash
npm run test:run    # Single run
npm run test        # Watch mode
```

**Current test coverage:**
- `src/domain/inventory.test.ts` - Item stacking rules
- `src/domain/rules/modifiers.test.ts` - Ability modifier calculations
- `src/domain/validation.test.ts` - Zod schema validation

**Manual testing checklist:**
- Import backup file with temporary modifiers - verify preserved
- Create character, add temp HP/AC, reload - verify persist
- Change Level 1 character class - verify saves auto-update
- Export and re-import - verify all fields roundtrip

## File References

Key entry points:
- `src/main.tsx:1` - React DOM mount
- `src/App.tsx:1` - Root component
- `src/state/useWorldState.ts:1` - Central state hook
- `src/domain/models/character.ts:1` - Core types
- `src/domain/validation.ts:1` - Zod schemas
