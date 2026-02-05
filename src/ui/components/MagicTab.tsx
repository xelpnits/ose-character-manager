import React, { useState, useCallback } from 'react';
import { Character, Spell } from '../../types';
import {
  getSpellSlots,
  canCastSpells,
  getSpellType,
  getMaxSpellLevel,
} from '../../domain/rules/spellSlots';
import { Sparkles, BookOpen, Plus, Trash2, Ban } from 'lucide-react';

interface MagicTabProps {
  character: Character;
  onUpdate: (char: Character) => void;
  onUpdateUndoable?: (char: Character, message: string) => void;
}

const MagicTab: React.FC<MagicTabProps> = ({
  character,
  onUpdate,
  onUpdateUndoable,
}) => {
  const [isAddingSpell, setIsAddingSpell] = useState(false);
  const [newSpellName, setNewSpellName] = useState('');
  const [newSpellLevel, setNewSpellLevel] = useState(1);
  const [newSpellDesc, setNewSpellDesc] = useState('');

  const isCaster = canCastSpells(character.class);
  const spellType = getSpellType(character.class);
  const slots = getSpellSlots(character.class, character.level);
  const maxSpellLevel = getMaxSpellLevel(character.class, character.level);
  const hasSlots = Object.keys(slots).length > 0;

  const updateUndoable = useCallback(
    (next: Character, message: string) => {
      if (onUpdateUndoable) onUpdateUndoable(next, message);
      else onUpdate(next);
    },
    [onUpdate, onUpdateUndoable]
  );

  const handleAddSpell = () => {
    if (!newSpellName.trim()) return;

    const newSpell: Spell = {
      id: crypto.randomUUID(),
      name: newSpellName.trim(),
      level: newSpellLevel,
      description: newSpellDesc.trim() || undefined,
    };

    const updatedSpells = [...(character.learnedSpells || []), newSpell];
    updateUndoable(
      { ...character, learnedSpells: updatedSpells },
      `Learned spell: ${newSpell.name}.`
    );

    setNewSpellName('');
    setNewSpellLevel(1);
    setNewSpellDesc('');
    setIsAddingSpell(false);
  };

  const handleRemoveSpell = (spell: Spell) => {
    const updatedSpells = (character.learnedSpells || []).filter(
      (s) => s.id !== spell.id
    );
    updateUndoable(
      { ...character, learnedSpells: updatedSpells },
      `Removed spell: ${spell.name}.`
    );
  };

  // Group spells by level
  const spellsByLevel: Record<number, Spell[]> = {};
  for (const spell of character.learnedSpells || []) {
    if (!spellsByLevel[spell.level]) {
      spellsByLevel[spell.level] = [];
    }
    spellsByLevel[spell.level].push(spell);
  }

  // Non-caster or no slots yet
  if (!isCaster) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center">
        <Ban className="w-12 h-12 mx-auto mb-4 text-slate-600" />
        <h2 className="text-lg font-serif font-bold text-slate-400 mb-2">
          No Spellcasting
        </h2>
        <p className="text-sm text-slate-500">
          {character.class} cannot cast spells.
        </p>
      </div>
    );
  }

  if (!hasSlots) {
    return (
      <div className="glass-panel rounded-2xl p-8 text-center">
        <Sparkles className="w-12 h-12 mx-auto mb-4 text-slate-600" />
        <h2 className="text-lg font-serif font-bold text-slate-400 mb-2">
          No Spells Yet
        </h2>
        <p className="text-sm text-slate-500">
          {character.class} gains spellcasting at a higher level.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Spell Slots Panel */}
      <div className="glass-panel rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-purple-400">
            Spell Slots ({spellType === 'arcane' ? 'Arcane' : 'Divine'})
          </h2>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {Object.entries(slots).map(([level, count]) => (
            <div
              key={level}
              className="bg-slate-900/50 border border-white/10 rounded-xl p-3 text-center"
            >
              <div className="text-[10px] uppercase text-slate-500 mb-1">
                Level {level}
              </div>
              <div className="text-2xl font-bold text-purple-300">{count}</div>
              <div className="text-[10px] text-slate-600">
                {count === 1 ? 'slot' : 'slots'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Learned Spells Panel */}
      <div className="glass-panel rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">
              {spellType === 'arcane' ? 'Spellbook' : 'Known Prayers'}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsAddingSpell(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs font-bold uppercase tracking-widest text-indigo-300 hover:text-white bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-lg transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add Spell
          </button>
        </div>

        {/* Add Spell Form */}
        {isAddingSpell && (
          <div className="mb-4 p-4 bg-slate-900/50 border border-indigo-500/30 rounded-xl">
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">
                    Spell Name
                  </label>
                  <input
                    type="text"
                    value={newSpellName}
                    onChange={(e) => setNewSpellName(e.target.value)}
                    placeholder="Magic Missile"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-0"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">
                    Spell Level
                  </label>
                  <select
                    value={newSpellLevel}
                    onChange={(e) => setNewSpellLevel(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-indigo-500 focus:ring-0"
                  >
                    {Array.from({ length: maxSpellLevel }, (_, i) => i + 1).map(
                      (lvl) => (
                        <option key={lvl} value={lvl}>
                          Level {lvl}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={newSpellDesc}
                  onChange={(e) => setNewSpellDesc(e.target.value)}
                  placeholder="Fires magical darts that always hit..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-indigo-500 focus:ring-0 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingSpell(false);
                    setNewSpellName('');
                    setNewSpellLevel(1);
                    setNewSpellDesc('');
                  }}
                  className="px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddSpell}
                  disabled={!newSpellName.trim()}
                  className="px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-indigo-300 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Spell
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Spell List */}
        {(character.learnedSpells || []).length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No spells learned yet. Click "Add Spell" to begin.
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(spellsByLevel)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([level, spells]) => (
                <div key={level}>
                  <div className="text-[10px] uppercase text-slate-500 font-bold mb-2">
                    Level {level} Spells
                  </div>
                  <div className="space-y-1">
                    {spells.map((spell) => (
                      <div
                        key={spell.id}
                        className="flex items-start justify-between gap-2 p-2 hover:bg-white/5 rounded-lg transition-colors group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-white truncate">
                            {spell.name}
                          </div>
                          {spell.description && (
                            <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                              {spell.description}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSpell(spell)}
                          className="p-1 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                          title="Remove spell"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MagicTab;
