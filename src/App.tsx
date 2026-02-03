import React, { useCallback, useState } from 'react';
import { Character, INITIAL_CHARACTER, Item, BANK_ID } from './types';
import CharacterList from './ui/components/CharacterList';
import CharacterEditor from './ui/components/CharacterEditor';
import ConfirmDialog from './ui/components/ConfirmDialog';
import DiceRoller from './ui/components/DiceRoller';
import { useWorldState } from './state/useWorldState';

const App: React.FC = () => {
  const {
    characters,
    setCharacters,
    bank,
    setBank,
    charactersRef,
    bankRef,
    exportData,
    importData,
  } = useWorldState();

  const [view, setView] = useState<'list' | 'editor'>('list');
  const [editingCharId, setEditingCharId] = useState<string | null>(null);

  // Dialog State
  const [charToDelete, setCharToDelete] = useState<string | null>(null);

  // --- Import / Export Handlers ---
  const handleExportData = useCallback(() => {
    exportData();
  }, [exportData]);

  const handleImportData = useCallback(
    (file: File) => {
      importData(file);
    },
    [importData]
  );

  // --- Handlers ---

  const handleNewCharacter = useCallback(() => {
    const newChar: Character = {
      ...INITIAL_CHARACTER,
      id: crypto.randomUUID(),
      name: 'New Character',
      containers: [
        {
          id: crypto.randomUUID(),
          name: 'Worn / Belt',
          type: 'equipped',
          items: [],
          isFixed: true,
        },
        { id: crypto.randomUUID(), name: 'Backpack', type: 'carried', items: [] },
      ],
    };

    setCharacters((prev) => [...prev, newChar]);
    setEditingCharId(newChar.id);
    setView('editor');
  }, [setCharacters]);

  const handleSelectCharacter = useCallback((char: Character) => {
    setEditingCharId(char.id);
    setView('editor');
  }, []);

  const handleRequestDelete = useCallback((id: string) => {
    setCharToDelete(id);
  }, []);

  const executeDeleteCharacter = useCallback(() => {
    if (!charToDelete) return;
    setCharacters((prev) => prev.filter((c) => c.id !== charToDelete));
    if (editingCharId === charToDelete) {
      setEditingCharId(null);
      setView('list');
    }
    setCharToDelete(null);
  }, [charToDelete, editingCharId, setCharacters]);

  const handleUpdateCharacter = useCallback(
    (updatedChar: Character) => {
      setCharacters((prev) => prev.map((c) => (c.id === updatedChar.id ? updatedChar : c)));
    },
    [setCharacters]
  );

  // --- CORE TRANSFER LOGIC ---

  // The Brain: Handles all movement, splitting, and merging
  const handleMoveItem = useCallback(
    (
      sourceOwnerId: string,
      sourceContainerId: string,
      itemId: string,
      targetOwnerId: string,
      quantity: number
    ) => {
      // 1. Deep Copy World State
      const nextCharacters = JSON.parse(JSON.stringify(charactersRef.current)) as Character[];
      const nextBank = JSON.parse(JSON.stringify(bankRef.current)) as Item[];

      // 2. Helper to find item location
      const findItemLocation = (
        ownerId: string,
        containerId: string,
        iId: string
      ): { container: Item[] | null; index: number; item: Item | null } => {
        if (ownerId === BANK_ID) {
          const idx = nextBank.findIndex((i) => i.id === iId);
          return { container: nextBank, index: idx, item: nextBank[idx] };
        } else {
          const char = nextCharacters.find((c) => c.id === ownerId);
          if (!char) return { container: null, index: -1, item: null };

          // If container is specific
          if (containerId !== 'any') {
            const cont = char.containers.find((c) => c.id === containerId);
            if (cont) {
              const idx = cont.items.findIndex((i) => i.id === iId);
              return { container: cont.items, index: idx, item: cont.items[idx] };
            }
          } else {
            // Search all containers
            for (const cont of char.containers) {
              const idx = cont.items.findIndex((i) => i.id === iId);
              if (idx !== -1) {
                return { container: cont.items, index: idx, item: cont.items[idx] };
              }
            }
          }
        }
        return { container: null, index: -1, item: null };
      };

      // 3. Helper to get Target Container
      const getTargetContainerList = (ownerId: string): Item[] | null => {
        if (ownerId === BANK_ID) return nextBank;
        const char = nextCharacters.find((c) => c.id === ownerId);
        if (!char) return null;

        // Prioritize "Backpack", then first non-fixed, then first available
        let target = char.containers.find(
          (c) =>
            !c.isFixed &&
            (c.name.toLowerCase().includes('rucksack') || c.name.toLowerCase().includes('backpack'))
        );
        if (!target) target = char.containers.find((c) => !c.isFixed);
        if (!target) target = char.containers[0];

        return target ? target.items : null;
      };

      // 4. Execution
      const sourceLoc = findItemLocation(sourceOwnerId, sourceContainerId, itemId);

      if (!sourceLoc.container || !sourceLoc.item || sourceLoc.index === -1) {
        console.error('Source item not found during move.');
        return;
      }

      const itemToMove = sourceLoc.item;
      const actualQty = Math.min(itemToMove.count, quantity); // Prevent moving more than we have

      // A. Remove (or Reduce) from Source
      if (itemToMove.count === actualQty) {
        // Moving entire stack
        sourceLoc.container.splice(sourceLoc.index, 1);
      } else {
        // Splitting stack
        itemToMove.count -= actualQty;
      }

      // B. Add to Target
      const targetList = getTargetContainerList(targetOwnerId);
      if (!targetList) {
        console.error('Target container not found.');
        return;
      }

      // AUTO-STACKING LOGIC
      const existingStack = targetList.find(
        (i) =>
          i.name === itemToMove.name &&
          i.category === itemToMove.category &&
          i.isMagical === itemToMove.isMagical &&
          i.goldValue === itemToMove.goldValue
      );

      if (existingStack) {
        existingStack.count += actualQty;
      } else {
        // Create new stack
        targetList.push({
          ...itemToMove,
          id: crypto.randomUUID(), // MUST generate new ID for the new location
          count: actualQty,
        });
      }

      // 5. Commit State
      setCharacters(nextCharacters);
      setBank(nextBank);
    },
    [bankRef, charactersRef, setBank, setCharacters]
  );

  // Wrapper for InventoryManager
  const handleTransferItem = useCallback(
    (targetCharId: string, item: Item) => {
      // InventoryManager passes the item *as it should be moved* (including the specific split count)
      // So we tell handleMoveItem to move 'item.count' amount of 'item.id'
      handleMoveItem(editingCharId!, 'any', item.id, targetCharId, item.count);
    },
    [editingCharId, handleMoveItem]
  );

  // Handle Global Add
  const handleGlobalAddItem = useCallback(
    (charId: string, containerId: string, item: Item) => {
      if (charId === BANK_ID) {
        setBank((prev) => [...prev, item]);
      } else {
        setCharacters((prev) =>
          prev.map((char) => {
            if (char.id !== charId) return char;
            return {
              ...char,
              containers: char.containers.map((cont) => {
                if (cont.id !== containerId) return cont;
                return { ...cont, items: [...cont.items, item] };
              }),
            };
          })
        );
      }
    },
    [setBank, setCharacters]
  );

  const handleClaimLoot = useCallback(() => {
    setCharacters((prev) => {
      return prev.map((char) => ({
        ...char,
        containers: char.containers.map((cont) => ({
          ...cont,
          items: cont.items.map((item) => {
            if (item.isUnclaimed) {
              return { ...item, isUnclaimed: false };
            }
            return item;
          }),
        })),
      }));
    });
  }, [setCharacters]);

  const activeCharacter = characters.find((c) => c.id === editingCharId);

  return (
    <div className="min-h-screen text-slate-200 selection:bg-indigo-500/30 selection:text-indigo-200">
      {view === 'list' && (
        <CharacterList
          characters={characters}
          bank={bank}
          onSelect={handleSelectCharacter}
          onDelete={handleRequestDelete}
          onNew={handleNewCharacter}
          onClaimLoot={handleClaimLoot}
          onMoveItem={handleMoveItem}
          onExport={handleExportData}
          onImport={handleImportData}
          onGlobalAddItem={handleGlobalAddItem}
        />
      )}

      {view === 'editor' && activeCharacter && (
        <CharacterEditor
          character={activeCharacter}
          otherCharacters={characters.filter((c) => c.id !== activeCharacter.id)}
          onUpdate={handleUpdateCharacter}
          onBack={() => setView('list')}
          onTransferItem={handleTransferItem}
        />
      )}

      <ConfirmDialog
        isOpen={!!charToDelete}
        title="Delete Character?"
        message="Are you sure? This cannot be undone. The character and all their items will be permanently deleted."
        confirmLabel="Delete"
        isDangerous={true}
        onConfirm={executeDeleteCharacter}
        onCancel={() => setCharToDelete(null)}
      />

      <DiceRoller />
    </div>
  );
};

export default App;
