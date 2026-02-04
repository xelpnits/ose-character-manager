# OSE Character Manager

A feature-rich character management tool for **Old-School Essentials (OSE)** tabletop RPG campaigns. Manage characters, inventories, party loot, and XP tracking—all with automatic local persistence and a polished dark-mode UI.

---

## Key Features

### Character Management
- Create and edit characters with all OSE classes: **Cleric, Dwarf, Elf, Fighter, Halfling, Magic-User, Thief**
- Full ability score tracking (STR, INT, WIS, DEX, CON, CHA) with B/X modifier calculation
- HP, Max HP, and **Temporary HP** tracking with visual health bar
- Armor Class (AC) with **temporary modifier** support (for spells/situational bonuses)
- All five OSE saving throws with temporary modifiers
- **Auto-apply class defaults** for Level 1 saving throws when switching classes

### Inventory System
- **Container-based inventory**: Equipped/Worn, Carried (Backpack), Stored
- Item categories: General, Weapon, Armor, Potion, Treasure, Scroll
- Item properties: damage dice, AC bonus, charges, magical flag, unidentified flag
- **Gold value & "New Loot" tracking** for XP calculation
- **Auto-stacking** of identical items and **stack splitting** for transfers
- Weight tracking per container with overload warnings

### Party Features
- **Party Bank**: Shared vault for storing items accessible to all characters
- **Global Inventory View**: See all items across all characters, grouped by category
- **Party Loot Tab**: Track unclaimed treasure for XP purposes
- Transfer items between characters with a right-click context menu

### XP Calculator
- **Manual XP entry** or **Session Calculator** mode
- Supports party split with configurable PC count
- **Retainer support** (half-share calculation per OSE rules)

### Dice Roller
- Built-in floating dice roller widget
- Supports d4, d6, d8, d10, d12, d20, d100
- Custom formula input (NdX+M)
- **Persistent chat log** with username, timestamps, and roll history

### Data Management
- **Export/Import** full party data as JSON backup
- **Debounced auto-save** (800ms) to browser localStorage
- **Activity Log** tracking all significant actions
- Undo support for destructive operations (delete, move)

---

## Quickstart

### Prerequisites

- **Node.js** v20+ (LTS recommended)
- npm (comes with Node.js)

### Install

```bash
npm install
```

### Dev Server

```bash
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
```

Outputs production bundle to `dist/`.

### Run Tests

```bash
npm run test:run
```

### Preview Production Build

```bash
npm run preview
```

---

## Project Structure

```
src/
├── App.tsx                 # Root component, state orchestration
├── main.tsx                # React entry point
├── index.css               # Tailwind imports + custom styles
├── types.ts                # Re-exports from domain/models
│
├── domain/
│   ├── models/
│   │   ├── character.ts    # Character, Item, Container types & defaults
│   │   ├── world.ts        # WorldState, BANK_ID
│   │   └── index.ts
│   ├── rules/
│   │   ├── modifiers.ts    # getModifier(), LEVEL_1_SAVES by class
│   │   └── weight.ts       # Weight calculation utilities
│   ├── inventory.ts        # Item stacking rules
│   └── validation.ts       # Zod schemas for import validation
│
├── state/
│   ├── useWorldState.ts    # Main state hook (characters, bank, log, save/load)
│   ├── persistence.ts      # LocalStorage read/write, export/import logic
│   ├── migrations.ts       # Data migration for schema changes
│   └── storage.ts          # Storage keys and constants
│
├── test/
│   └── setup.ts            # Vitest setup
│
└── ui/
    ├── components/
    │   ├── CharacterList.tsx       # Roster view, Party Loot, Global Inventory
    │   ├── CharacterEditor.tsx     # Character sheet (stats, HP, AC, saves)
    │   ├── InventoryManager.tsx    # Container & item management
    │   ├── XPCalculatorModal.tsx   # XP entry and party split calculator
    │   ├── DiceRoller.tsx          # Floating dice roller widget
    │   ├── ActivityLogModal.tsx    # Action history viewer
    │   ├── ErrorBoundary.tsx       # Error boundary for graceful crashes
    │   ├── ConfirmDialog.tsx       # Generic confirmation dialog
    │   ├── StackSplitDialog.tsx    # Stack split quantity picker
    │   ├── ImportExportControls.tsx
    │   ├── StatInput.tsx           # Ability score input with +/- controls
    │   ├── CommitNumberInput.tsx   # Commit-on-blur number input
    │   └── Toast.tsx               # Notification toast with undo support
    ├── icons.tsx           # Category and class icon helpers
    └── labels.ts           # UI label constants
```

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| [Vite](https://vitejs.dev/) | 6 | Build tool and dev server |
| [React](https://react.dev/) | 19 | UI framework |
| [TypeScript](https://www.typescriptlang.org/) | 5.8 | Type safety (strict mode) |
| [Tailwind CSS](https://tailwindcss.com/) | 3 | Utility-first styling |
| [Zod](https://zod.dev/) | 4 | Runtime validation for imports |
| [Vitest](https://vitest.dev/) | 3 | Unit testing |
| [Lucide React](https://lucide.dev/) | 0.563 | Icon library |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run lint` | Run ESLint |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |

---

## Data Persistence

All data is stored in **browser localStorage**:

| Key | Contents |
|-----|----------|
| `ose_character_manager_v1` | Character array (JSON) |
| `ose_bank_v1` | Bank/vault items (JSON) |
| `ose_activity_log_v1` | Activity log entries (max 200) |
| `ose_dice_log` | Dice roller chat history (max 200) |
| `ose_username` | Dice roller username |

### Auto-Save Behavior

- Changes trigger a **debounced save** after 800ms of inactivity
- A sync save runs on `beforeunload` (tab close) to prevent data loss
- Visual indicator shows "Saving…" / "Saved" / "Error" status

### Export Format

```json
{
  "version": 1,
  "date": "2026-02-04T12:00:00.000Z",
  "characters": [...],
  "bank": [...]
}
```

---

## Contributing

### Local Development

1. Fork and clone the repository
2. Run `npm install`
3. Run `npm run dev` to start the dev server
4. Make changes and test locally

### Code Style

- TypeScript **strict mode** is enabled
- Components use functional React with hooks
- State management via custom hooks (`useWorldState`)
- ESLint configured for React hooks rules

### Pull Request Process

1. Create a feature branch from `main`
2. Ensure builds pass: `npm run build`
3. Ensure tests pass: `npm run test:run`
4. Ensure linting passes: `npm run lint`
5. Open a PR with a description of changes

---

## License

This project currently has no explicit open-source license. Contact the repository owner for licensing inquiries.

---

## Acknowledgements

- **Old-School Essentials** by Necrotic Gnome for the B/X ruleset
- [Lucide](https://lucide.dev/) for the icon library
- [Tailwind CSS](https://tailwindcss.com/) for styling utilities
