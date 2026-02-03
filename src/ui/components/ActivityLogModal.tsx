import React, { useEffect, useMemo, useRef } from 'react';
import { ScrollText, X } from 'lucide-react';
import type { ActivityLogEntry } from '../../state/useWorldState';

function formatTs(ts: number): string {
  try {
    return new Date(ts).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

const ActivityLogModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  entries: ActivityLogEntry[];
}> = ({ isOpen, onClose, entries }) => {
  const lastActiveRef = useRef<HTMLElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const sorted = useMemo(() => {
    // Ensure chronological order (oldest -> newest)
    return [...entries].sort((a, b) => a.ts - b.ts);
  }, [entries]);

  useEffect(() => {
    if (!isOpen) return;
    lastActiveRef.current = document.activeElement as HTMLElement;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);
    setTimeout(() => closeBtnRef.current?.focus(), 0);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      lastActiveRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      onMouseDown={onClose}
    >
      <div
        className="bg-slate-950/95 backdrop-blur-xl border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10 animate-slide-up"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-900/70 px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-200">Activity Log</h3>
          </div>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Close"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {sorted.length === 0 ? (
            <div className="glass-panel rounded-2xl p-8 text-center">
              <div className="text-slate-200 font-serif text-xl mb-1">No activity yet</div>
              <div className="text-slate-500 text-sm">Your recent actions will appear here.</div>
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto custom-scrollbar rounded-xl">
              <ol className="space-y-2">
                {sorted.map((e) => (
                  <li key={e.id} className="glass-panel rounded-xl px-4 py-3 border border-white/5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="text-slate-200 text-sm font-semibold leading-snug">{e.message}</div>
                      <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500 whitespace-nowrap">
                        {formatTs(e.ts)}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLogModal;
