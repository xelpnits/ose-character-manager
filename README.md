# OSE Character Manager

A feature-rich character management tool for **Old-School Essentials (OSE)** tabletop RPG campaigns. Manage characters, inventories, party loot, and XP tracking—all with automatic local persistence and a polished dark-mode UI.

---

## Table of Contents

- [Key Features](#key-features)
- [Demo / Screenshots](#demo--screenshots)
- [Quickstart](#quickstart)
- [Usage Guide](#usage-guide)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Configuration](#configuration)
- [Data / Persistence](#data--persistence)
- [Migration Notes](#migration-notes)
- [UX Notes](#ux-notes)
- [Contributing](#contributing)
- [License](#license)

---

## Key Features

### Character Management
- Create and edit characters with all OSE classes: **Cleric, Dwarf, Elf, Fighter, Halfling, Magic-User, Thief**
- Full ability score tracking (STR, INT, WIS, DEX, CON, CHA) with B/X modifier calculation
- HP, Max HP, and **Temporary HP** tracking with visual health bar
- Armor Class (AC) with **temporary modifier** support (for spells/situational bonuses)
- All five OSE saving throws (Death/Poison, Wands, Paralysis, Breath, Spells) with temporary modifiers
- **Auto-apply class defaults** for Level 1 saving throws when switching classes

### Inventory System
- **Container-based inventory**: Equipped/Worn, Carried (Backpack), Stored
- Item categories: General, Weapon, Armor, Potion, Treasure, Scroll
- Item properties: damage dice, AC bonus, charges, magical flag, unidentified flag
- **Gold value & "New Loot" tracking** for XP calculation
- Drag-and-drop item movement between containers
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
- **Chat log** with username, timestamps, and roll history

### Data Management
- **Export/Import** full party data as JSON backup
- **Debounced auto-save** (800ms) to browser localStorage
- **Activity Log** tracking all significant actions
- Undo support for destructive operations (delete, move)

---

## Demo / Screenshots

No hosted demo currently available. Run locally to try it out (see [Quickstart](#quickstart)).

---

## Quickstart

### Prerequisites

- **Node.js** (LTS recommended, v18+)
- npm (comes with Node.js)

### Install

```bash
npm install
```

### Dev Server

```bash
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000) by default.

### Build

```bash
npm run build
```

Outputs production bundle to `dist/`.

### Preview Production Build

```bash
npm run preview
```

---

## Usage Guide

### Creating a Character

1. Click **"New Character"** on the Roster screen
2. Enter a name in the sticky header (editable anytime)
3. Select **Class** and **Alignment** from dropdowns
4. Adjust **Ability Scores** using +/- buttons (valid range: 3–18)
5. Saving throws auto-populate based on class at Level 1

### Managing Inventory

1. Navigate to the **Inventory** tab from the character sheet
2. Use **"Add Item"** within any container to create items
3. Click an item to open the **Item Detail Modal** for editing properties
4. Right-click an item to access **context menu** (Edit, Move, Give, Delete)
5. Drag and drop items between containers

### Transferring Items to Other Characters

1. Right-click an item → select **"Give to"** → choose target character or **The Bank**
2. For stacks, a **split dialog** lets you choose quantity to transfer
3. Items auto-stack at the destination if identical

### XP Tracking

1. Click the **XP card** on the character sheet to open the XP Manager
2. Use **Manual** tab to add a fixed amount
3. Use **Calculator** tab to split session XP among party members (supports retainers at half-share)

### Export & Import

- Click **Export** (top of Roster screen) to download `ose-backup-YYYY-MM-DD.json`
- Click **Import** and select a backup file to restore data
- Import runs migration automatically to ensure compatibility

### Dice Roller

- Click the **dice icon** (bottom-left) to open the roller
- Set your name on first use (persisted)
- Configure dice count, sides, and modifier, or use quick-roll buttons (d4–d100)

---

## Project Structure

```
src/
├── App.tsx                 # Root component, routing, state orchestration
├── main.tsx                # React entry point
├── index.tsx               # Secondary entry (re-exports App)
├── types.ts                # Re-exports from domain/models
├── constants.ts            # Re-exports labels and modifiers
├── utils.ts                # Re-exports utility functions
│
├── domain/
│   ├── models/
│   │   ├── character.ts    # Character, Item, Container types & defaults
│   │   ├── world.ts        # WorldState, BANK_ID
│   │   └── index.ts
│   ├── rules/
│   │   ├── modifiers.ts    # getModifier(), LEVEL_1_SAVES by class
│   │   └── weight.ts       # Weight calculation utilities
│   ├── inventory.ts        # Inventory domain logic
│   └── validation.ts       # Zod schemas for import validation
│
├── state/
│   ├── useWorldState.ts    # Main state hook (characters, bank, log, save/load)
│   ├── persistence.ts      # LocalStorage read/write, export/import logic
│   ├── migrations.ts       # Data migration for schema changes
│   └── storage.ts          # Storage keys and constants
│
└── ui/
    ├── components/
    │   ├── CharacterList.tsx       # Roster view, Party Loot, Global Inventory
    │   ├── CharacterEditor.tsx     # Character sheet (stats, HP, AC, saves)
    │   ├── InventoryManager.tsx    # Container & item management
    │   ├── XPCalculatorModal.tsx   # XP entry and party split calculator
    │   ├── DiceRoller.tsx          # Floating dice roller widget
    │   ├── ActivityLogModal.tsx    # Action history viewer
    │   ├── ConfirmDialog.tsx       # Generic confirmation dialog
    │   ├── StackSplitDialog.tsx    # Stack split quantity picker
    │   ├── ImportExportControls.tsx
    │   ├── StatInput.tsx           # Ability score input with +/- controls
    │   ├── CommitNumberInput.tsx   # Commit-on-blur number input
    │   └── Toast.tsx               # Notification toast with undo support
    ├── icons.tsx           # Category and class icon helpers
    └── labels.ts           # UI label constants (ABILITY_LABELS, CLASS_OPTIONS)
```

---

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| [Vite](https://vitejs.dev/) | ^6.2.0 | Build tool and dev server |
| [React](https://react.dev/) | ^19.2.4 | UI framework |
| [TypeScript](https://www.typescriptlang.org/) | ~5.8.2 | Type safety |
| [Tailwind CSS](https://tailwindcss.com/) | CDN | Utility-first styling |
| [Zod](https://zod.dev/) | ^4.3.6 | Runtime validation for imports |
| [Lucide React](https://lucide.dev/) | ^0.563.0 | Icon library |

---

## Configuration

### Vite Configuration (`vite.config.ts`)

- Dev server runs on port **3000** (host: `0.0.0.0`)
- Path alias: `@/` → `src/`
- Environment variables `GEMINI_API_KEY` are exposed (currently unused in app logic)

### TypeScript (`tsconfig.json`)

- Target: ES2022
- Module: ESNext with bundler resolution
- JSX: react-jsx
- Path alias: `@/*` → `./src/*`

### Tailwind

Tailwind is loaded via **CDN** in `index.html` with a custom theme extending:
- Color palette: `arcane-*` (dark slate/indigo theme)
- Fonts: Inter (sans), Crimson Pro (serif)
- Custom animations: `fade-in`, `slide-up`, `pulse-slow`

---

## Data / Persistence

All data is stored in **browser localStorage**:

| Key | Contents |
|-----|----------|
| `ose_character_manager_v1` | Character array (JSON) |
| `ose_bank_v1` | Bank/vault items (JSON) |
| `ose_activity_log_v1` | Activity log entries (max 200) |
| `ose_username` | Dice roller username |

### Auto-Save Behavior

- Changes trigger a **debounced save** after 800ms of inactivity
- A sync save runs on `beforeunload` (tab close) to prevent data loss
- Visual indicator shows "Saving…" / "Saved" / "Error" status

### Export Format

```json
{
  "version": 1,
  "date": "2026-02-03T12:00:00.000Z",
  "characters": [...],
  "bank": [...]
}
```

---

## Migration Notes

See [`MIGRATION_NOTES.md`](./MIGRATION_NOTES.md) for detailed changelog.

**Key fixes in v1.1.0:**
- Temporary ability modifiers (`abilityModifiers`) are now preserved separately from base scores during migration
- Zod validation schema includes all optional fields (`tempHp`, `acModifier`, `saveModifiers`, etc.)
- Fixed stale closure issues in auto-save effects

---

## UX Notes

See [`UX_REVIEW.md`](./UX_REVIEW.md) for a detailed UX/behavior audit.

**Summary:**
- Commit-on-blur inputs prevent accidental saves during typing
- Undo support via toast notifications for destructive actions
- Keyboard navigation: Escape closes all modals
- Drag-and-drop for inventory items within containers

---

## Contributing

### Local Development

1. Fork and clone the repository
2. Run `npm install`
3. Run `npm run dev` to start the dev server
4. Make changes and test locally

### Code Style

- TypeScript strict mode is not enabled but types are used throughout
- Components use functional React with hooks
- State management via custom hooks (`useWorldState`)

### Pull Request Process

1. Create a feature branch from `main`
2. Ensure the build passes: `npm run build`
3. Write clear commit messages
4. Open a PR with a description of changes

---

## License

**No license file found.** This project currently has no explicit open-source license. Contact the repository owner for licensing inquiries.

---

## Acknowledgements

- **Old-School Essentials** by Necrotic Gnome for the B/X ruleset
- [Lucide](https://lucide.dev/) for the icon library
- [Tailwind CSS](https://tailwindcss.com/) for styling utilities
