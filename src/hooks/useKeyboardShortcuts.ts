import { useEffect, useCallback } from 'react';

interface ShortcutHandlers {
  onUndo?: () => void;
  onSave?: () => void;
  onExport?: () => void;
  onNewCharacter?: () => void;
}

/**
 * Hook for global keyboard shortcuts.
 *
 * Supported shortcuts:
 * - Ctrl+Z: Undo (if handler provided)
 * - Ctrl+S: Save (if handler provided)
 * - Ctrl+E: Export (if handler provided)
 * - N: New character (if handler provided, only when not typing in an input)
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      const target = e.target as HTMLElement;
      const isTyping = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      const isContentEditable = target.isContentEditable;

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
      } else if (!isTyping && !isContentEditable) {
        switch (e.key.toLowerCase()) {
          case 'n':
            if (handlers.onNewCharacter) {
              e.preventDefault();
              handlers.onNewCharacter();
            }
            break;
        }
      }
    },
    [handlers]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export default useKeyboardShortcuts;
