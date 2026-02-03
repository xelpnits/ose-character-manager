import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Character, INITIAL_CHARACTER, Item, ItemCategory } from './types';
import CharacterList from './components/CharacterList';
import CharacterEditor from './components/CharacterEditor';
import ConfirmDialog from './components/ConfirmDialog';
import DiceRoller from './components/DiceRoller';

const STORAGE_KEY = 'ose_character_manager_v1';
const BANK_STORAGE_KEY = 'ose_bank_v1';
const DEBOUNCE_DELAY_MS = 800;

export const BANK_ID = 'BANK_VAULT';

const App: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [bank, setBank] = useState<Item[]>([]);
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [editingCharId, setEditingCharId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Refs for synchronous access (autosave/unload)
  const charactersRef = useRef(characters);
  const bankRef = useRef(bank);
  
  // Dialog State
  const [charToDelete, setCharToDelete] = useState<string | null>(null);

  // 1. Update Refs
  useEffect(() => {
    charactersRef.current = characters;
    bankRef.current = bank;
  }, [characters, bank]);

  // 2. Load from Local Storage on Mount
  useEffect(() => {
    const savedChars = localStorage.getItem(STORAGE_KEY);
    const savedBank = localStorage.getItem(BANK_STORAGE_KEY);
    
    if (savedChars) {
      try {
        setCharacters(JSON.parse(savedChars));
      } catch (e) {
        console.error("Failed to parse saved characters", e);
      }
    }
    
    if (savedBank) {
      try {
        setBank(JSON.parse(savedBank));
      } catch (e) {
        console.error("Failed to parse saved bank", e);
      }
    }

    setIsLoaded(true);
  }, []);

  // 3. Debounced Auto-Save
  useEffect(() => {
    if (!isLoaded) return;

    const handler = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
      localStorage.setItem(BANK_STORAGE_KEY, JSON.stringify(bank));
    }, DEBOUNCE_DELAY_MS);

    return () => clearTimeout(handler);
  }, [characters, bank, isLoaded]);

  // 4. Safety Save on Tab Close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isLoaded) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(charactersRef.current));
        localStorage.setItem(BANK_STORAGE_KEY, JSON.stringify(bankRef.current));
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isLoaded]);

  // --- Import / Export Handlers ---
  const handleExportData = useCallback(() => {
    const data = {
        version: 1,
        date: new Date().toISOString(),
        characters: charactersRef.current,
        bank: bankRef.current
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ose-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleImportData = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const json = JSON.parse(e.target?.result as string);
            if (json.characters && Array.isArray(json.characters)) {
                setCharacters(json.characters);
            }
            if (json.bank && Array.isArray(json.bank)) {
                setBank(json.bank);
            }
            alert('Data successfully imported!');
        } catch (err) {
            console.error(err);
            alert('Error importing file.');
        }
    };
    reader.readAsText(file);
  }, []);

  // --- Handlers ---

  const handleNewCharacter = useCallback(() => {
    const newChar: Character = { 
        ...INITIAL_CHARACTER, 
        id: crypto.randomUUID(),
        name: 'New Character',
        containers: [
            { id: crypto.randomUUID(), name: 'Worn / Belt', items: [], isFixed: true },
            { id: crypto.randomUUID(), name: 'Backpack', items: [] }
        ]
    };
    
    setCharacters(prev => [...prev, newChar]);
    setEditingCharId(newChar.id);
    setView('editor');
  }, []);

  const handleSelectCharacter = useCallback((char: Character) => {
    setEditingCharId(char.id);
    setView('editor');
  }, []);

  const handleRequestDelete = useCallback((id: string) => {
      setCharToDelete(id);
  }, []);

  const executeDeleteCharacter = useCallback(() => {
    if (!charToDelete) return;
    setCharacters(prev => prev.filter(c => c.id !== charToDelete));
    if (editingCharId === charToDelete) {
        setEditingCharId(null);
        setView('list');
    }
    setCharToDelete(null);
  }, [charToDelete, editingCharId]);

  const handleUpdateCharacter = useCallback((updatedChar: Character) => {
      setCharacters(prev => prev.map(c => c.id === updatedChar.id ? updatedChar : c));
  }, []);

  // --- CORE TRANSFER LOGIC ---
  
  // Wrapper for InventoryManager
  const handleTransferItem = useCallback((targetCharId: string, item: Item) => {
      // InventoryManager passes the item *as it should be moved* (including the specific split count)
      // So we tell handleMoveItem to move 'item.count' amount of 'item.id'
      handleMoveItem(editingCharId!, 'any', item.id, targetCharId, item.count);
  }, [editingCharId]);

  // The Brain: Handles all movement, splitting, and merging
  const handleMoveItem = useCallback((
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
    const findItemLocation = (ownerId: string, containerId: string, iId: string): { container: Item[] | null, index: number, item: Item | null } => {
        if (ownerId === BANK_ID) {
            const idx = nextBank.findIndex(i => i.id === iId);
            return { container: nextBank, index: idx, item: nextBank[idx] };
        } else {
            const char = nextCharacters.find(c => c.id === ownerId);
            if (!char) return { container: null, index: -1, item: null };
            
            // If container is specific
            if (containerId !== 'any') {
                const cont = char.containers.find(c => c.id === containerId);
                if (cont) {
                    const idx = cont.items.findIndex(i => i.id === iId);
                    return { container: cont.items, index: idx, item: cont.items[idx] };
                }
            } else {
                // Search all containers
                for (const cont of char.containers) {
                    const idx = cont.items.findIndex(i => i.id === iId);
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
        const char = nextCharacters.find(c => c.id === ownerId);
        if (!char) return null;
        
        // Prioritize "Backpack", then first non-fixed, then first available
        let target = char.containers.find(c => !c.isFixed && (c.name.toLowerCase().includes('rucksack') || c.name.toLowerCase().includes('backpack')));
        if (!target) target = char.containers.find(c => !c.isFixed);
        if (!target) target = char.containers[0];
        
        return target ? target.items : null;
    };

    // 4. Execution
    const sourceLoc = findItemLocation(sourceOwnerId, sourceContainerId, itemId);
    
    if (!sourceLoc.container || !sourceLoc.item || sourceLoc.index === -1) {
        console.error("Source item not found during move.");
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
        console.error("Target container not found.");
        return; 
        // Note: In a real app we might want to revert source removal here, 
        // but given the logic simplicity, if target fails, item is lost. 
        // However, getTargetContainerList is robust enough to find *something*.
    }

    // AUTO-STACKING LOGIC
    // We check if an IDENTICAL item exists in the target list.
    // Identity = Name + Category + Magic Status + Value (simple heuristic)
    const existingStack = targetList.find(i => 
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
            count: actualQty
        });
    }

    // 5. Commit State
    setCharacters(nextCharacters);
    setBank(nextBank);

  }, []);

  const handleClaimLoot = useCallback(() => {
    setCharacters(prev => {
        return prev.map(char => ({
            ...char,
            containers: char.containers.map(cont => ({
                ...cont,
                items: cont.items.map(item => {
                    if (item.isUnclaimed) {
                        return { ...item, isUnclaimed: false };
                    }
                    return item;
                })
            }))
        }));
    });
  }, []);

  const activeCharacter = characters.find(c => c.id === editingCharId);

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
        />
      )}
      
      {view === 'editor' && activeCharacter && (
        <CharacterEditor 
          character={activeCharacter}
          otherCharacters={characters.filter(c => c.id !== activeCharacter.id)}
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