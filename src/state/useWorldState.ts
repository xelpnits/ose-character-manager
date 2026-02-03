import { useCallback, useEffect, useRef, useState } from 'react';
import { Character, Item } from '../types';
import { DEBOUNCE_DELAY_MS } from './storage';
import {
  loadFromLocalStorage,
  makeExportBlob,
  parseImportJson,
  saveToLocalStorage,
} from './persistence';

export function useWorldState() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [bank, setBank] = useState<Item[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Refs for synchronous access (autosave/unload)
  const charactersRef = useRef(characters);
  const bankRef = useRef(bank);

  useEffect(() => {
    charactersRef.current = characters;
    bankRef.current = bank;
  }, [characters, bank]);

  // Load on mount
  useEffect(() => {
    const { characters: loadedChars, bank: loadedBank } = loadFromLocalStorage();
    setCharacters(loadedChars);
    setBank(loadedBank);
    setIsLoaded(true);
  }, []);

  // Debounced auto-save
  useEffect(() => {
    if (!isLoaded) return;
    const handler = setTimeout(() => {
      saveToLocalStorage(characters, bank);
    }, DEBOUNCE_DELAY_MS);
    return () => clearTimeout(handler);
  }, [characters, bank, isLoaded]);

  // Safety save on tab close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isLoaded) {
        saveToLocalStorage(charactersRef.current, bankRef.current);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isLoaded]);

  const exportData = useCallback(() => {
    const blob = makeExportBlob(charactersRef.current, bankRef.current);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ose-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const importData = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const { characters: nextChars, bank: nextBank } = parseImportJson(
          e.target?.result as string
        );
        if (nextChars) setCharacters(nextChars);
        if (nextBank) setBank(nextBank);
        alert('Data successfully imported!');
      } catch (err) {
        console.error(err);
        alert('Error importing file.');
      }
    };
    reader.readAsText(file);
  }, []);

  return {
    characters,
    setCharacters,
    bank,
    setBank,
    isLoaded,
    charactersRef,
    bankRef,
    exportData,
    importData,
  };
}
