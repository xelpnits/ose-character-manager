import React from 'react';
import { getModifier, formatModifier } from '../../domain/rules/modifiers';
import CommitNumberInput from './CommitNumberInput';

interface StatInputProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
}

const MIN_SCORE = 3;
const MAX_SCORE = 18;

const clamp = (n: number) => Math.max(MIN_SCORE, Math.min(MAX_SCORE, n));

const StatInput: React.FC<StatInputProps> = ({ label, value, onChange }) => {
  const mod = getModifier(value);
  const isPositive = mod > 0;
  const isNegative = mod < 0;

  return (
    <div className="relative group bg-slate-900/50 border border-white/10 rounded-xl p-3 flex flex-col items-center justify-between transition-all hover:border-indigo-500/50 hover:bg-slate-800">
      <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1 group-hover:text-indigo-400 transition-colors">
        {label}
      </label>

      <div className="relative w-full flex justify-center my-1 items-end gap-2">
        <button
          type="button"
          onClick={() => onChange(clamp((value || 0) - 1))}
          className="w-8 h-8 rounded-lg bg-slate-950/50 hover:bg-slate-950 border border-white/10 text-slate-400 hover:text-white transition-colors"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>

        <CommitNumberInput
          min={MIN_SCORE}
          max={MAX_SCORE}
          value={value}
          emptyCommit="keep"
          transform={clamp}
          onCommit={(n) => {
            if (typeof n !== 'number') return;
            onChange(n);
          }}
          className="w-full bg-transparent text-center font-serif text-3xl font-bold text-white focus:outline-none appearance-none m-0 p-0 z-10 cursor-pointer"
        />

        <button
          type="button"
          onClick={() => onChange(clamp((value || 0) + 1))}
          className="w-8 h-8 rounded-lg bg-slate-950/50 hover:bg-slate-950 border border-white/10 text-slate-400 hover:text-white transition-colors"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>

      <div className="flex gap-1 items-center">
        <div
          className={`
            text-xs font-mono font-bold px-2 py-0.5 rounded-full border 
            ${
              isPositive
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : isNegative
                  ? 'bg-red-500/10 text-red-400 border-red-500/20'
                  : 'bg-slate-700/50 text-slate-400 border-slate-600'
            }
        `}
        >
          {formatModifier(mod)}
        </div>
      </div>
    </div>
  );
};

export default StatInput;
