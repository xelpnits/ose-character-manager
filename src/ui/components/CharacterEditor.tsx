import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Character, OSEClass, Alignment, AbilityScore, Container, Item, SavingThrows } from '../../types';
import { ABILITY_LABELS, CLASS_OPTIONS, LEVEL_1_SAVES } from '../../constants';
import StatInput from './StatInput';
import CommitNumberInput from './CommitNumberInput';
import InventoryManager from './InventoryManager';
import XPCalculatorModal from './XPCalculatorModal';
import {
  ArrowLeft,
  Shield,
  Heart,
  Skull,
  Zap,
  Trophy,
  CloudLightning,
  Calculator,
  Activity,
  PlusCircle,
  MinusCircle,
  ChevronDown,
  Backpack,
  LayoutGrid,
} from 'lucide-react';

interface CharacterEditorProps {
  character: Character;
  otherCharacters: Character[];
  saveStatus?: 'saving' | 'saved' | 'error';
  onUpdate: (char: Character) => void;
  onUpdateUndoable?: (char: Character, message: string) => void;
  onBack: () => void;
  onTransferItem: (targetCharId: string, item: Item) => void;
}

type EditorTab = 'sheet' | 'inventory';

// Moved outside to prevent recreation on every render
const QuickModButton: React.FC<{ val: number; onClick: () => void; label?: string }> = ({ val, onClick, label }) => (
  <button
    type="button"
    onClick={onClick}
    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-[10px] font-bold text-slate-300 transition-colors"
  >
    {label || (val > 0 ? `+${val}` : val)}
  </button>
);

const TabButton: React.FC<{
  tab: EditorTab;
  activeTab: EditorTab;
  label: string;
  icon: React.ReactNode;
  onClick: (tab: EditorTab) => void;
}> = ({ tab, activeTab, label, icon, onClick }) => (
  <button
    type="button"
    onClick={() => onClick(tab)}
    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors border ${
      activeTab === tab
        ? 'bg-white/10 text-white border-white/10'
        : 'bg-transparent text-slate-400 border-transparent hover:bg-white/5 hover:text-white'
    }`}
    aria-current={activeTab === tab ? 'page' : undefined}
  >
    <span className="opacity-80">{icon}</span>
    {label}
  </button>
);

const CollapsiblePanel: React.FC<{
  id: string;
  title: string;
  icon?: React.ReactNode;
  isOpen: boolean;
  onToggle: (id: string, open: boolean) => void;
  children: React.ReactNode;
}> = ({ id, title, icon, isOpen, onToggle, children }) => (
  <details
    open={isOpen}
    onToggle={(e) => {
      const nextOpen = (e.currentTarget as HTMLDetailsElement).open;
      onToggle(id, nextOpen);
    }}
    className="glass-panel rounded-2xl group"
  >
    <summary className="list-none cursor-pointer select-none px-5 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400">{title}</h2>
      </div>
      <ChevronDown className="w-4 h-4 text-slate-500 transition-transform group-open:rotate-180" />
    </summary>
    <div className="px-5 pb-5 pt-1">{children}</div>
  </details>
);

const CharacterEditor: React.FC<CharacterEditorProps> = ({
  character,
  otherCharacters,
  saveStatus = 'saved',
  onUpdate,
  onUpdateUndoable,
  onBack,
  onTransferItem,
}) => {
  const [showXPModal, setShowXPModal] = useState(false);
  const [activeTab, setActiveTab] = useState<EditorTab>('sheet');

  const updateUndoable = useCallback(
    (next: Character, message: string) => {
      if (onUpdateUndoable) onUpdateUndoable(next, message);
      else onUpdate(next);
    },
    [onUpdate, onUpdateUndoable]
  );

  // Refs to avoid stale closures in effects that shouldn't re-run on every character change
  const characterRef = useRef(character);
  const onUpdateRef = useRef(onUpdate);
  const prevClassRef = useRef(character.class);

  useEffect(() => {
    characterRef.current = character;
    onUpdateRef.current = onUpdate;
  });

  // Reset to the main sheet when switching characters.
  useEffect(() => {
    setActiveTab('sheet');
    // Reset previous-class tracking per character
    prevClassRef.current = character.class;
  }, [character.id, character.class]);

  // Auto-apply level-1 class saves ONLY when it looks like saves were not custom.
  // Rule:
  // - At level 1: if the current saves match the previous class' level-1 defaults,
  //   then a class change will update saves to the new class' level-1 defaults.
  // - At level > 1: never auto-update saves (user controls them).
  useEffect(() => {
    const char = characterRef.current;
    const update = onUpdateRef.current;
    const prevClass = prevClassRef.current;

    const classChanged = prevClass !== char.class;

    if (classChanged && char.level === 1) {
      const prevDefaults = LEVEL_1_SAVES[prevClass as keyof typeof LEVEL_1_SAVES] as SavingThrows | undefined;
      const nextDefaults = LEVEL_1_SAVES[char.class] as SavingThrows | undefined;

      if (prevDefaults && nextDefaults) {
        const currentSaves = JSON.stringify(char.savingThrows);
        const prevSaves = JSON.stringify(prevDefaults);

        // Only overwrite if saves were still at previous defaults
        if (currentSaves === prevSaves) {
          update({ ...char, savingThrows: nextDefaults });
        }
      }
    }

    prevClassRef.current = char.class;
  }, [character.class, character.level]);

  const handleStatChange = (stat: AbilityScore, val: number) => {
    onUpdate({
      ...character,
      abilities: { ...character.abilities, [stat]: val },
    });
  };
  const handleInventoryChange = (newContainers: Container[]) => {
    onUpdate({ ...character, containers: newContainers });
  };

  const handleInventoryChangeUndoable = (newContainers: Container[], message: string) => {
    if (onUpdateUndoable) {
      onUpdateUndoable({ ...character, containers: newContainers }, message);
    } else {
      onUpdate({ ...character, containers: newContainers });
    }
  };

  const saveIndicator = useMemo(() => {
    const base =
      saveStatus === 'saving'
        ? 'text-amber-400/90'
        : saveStatus === 'error'
          ? 'text-red-400/90'
          : 'text-emerald-400/80';
    const label = saveStatus === 'saving' ? 'Saving…' : saveStatus === 'error' ? 'Save Error' : 'Saved';
    const title = saveStatus === 'saving' ? 'Saving…' : saveStatus === 'error' ? 'Save error' : 'Saved';
    return { base, label, title };
  }, [saveStatus]);

  const [openPanels, setOpenPanels] = useState<Record<string, boolean>>({
    identity: true,
    abilities: true,
    'saving-throws': false,
  });

  const handlePanelToggle = useCallback((id: string, open: boolean) => {
    setOpenPanels((prev) => ({ ...prev, [id]: open }));
  }, []);

  return (
    <div className="min-h-screen bg-arcane-950 pb-24 text-slate-200">
      {/* 1. Sticky Command Bar */}
      <div className="sticky top-0 z-40 w-full bg-slate-950/80 backdrop-blur-xl border-b border-white/5 shadow-2xl">
        <div className="max-w-screen-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              title="Back to Roster"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline font-semibold">Back</span>
            </button>
            <div className="h-6 w-px bg-white/10 hidden sm:block"></div>

            {/* Live Name Editor */}
            <input
              type="text"
              value={character.name}
              onChange={(e) => onUpdate({ ...character, name: e.target.value })}
              maxLength={50}
              className="bg-transparent border-none text-lg font-serif font-bold text-white placeholder-slate-600 focus:ring-0 px-0 w-48 sm:w-auto truncate"
              placeholder="Character Name"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Auto-Save Indicator */}
            <div
              className={`flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest mr-4 ${saveIndicator.base}`}
              title={saveIndicator.title}
            >
              <CloudLightning className={`w-3 h-3 ${saveStatus === 'saving' ? 'animate-pulse' : ''}`} />
              <span className="hidden sm:inline">{saveIndicator.label}</span>
            </div>

            <div className="hidden md:flex items-center gap-2 bg-slate-900/50 rounded-lg px-3 py-1.5 border border-white/5">
              <span className="text-xs text-slate-400 uppercase font-bold">Lvl</span>
              <CommitNumberInput
                value={character.level}
                emptyCommit="keep"
                transform={(n) => Math.max(1, n)}
                onCommit={(n) => {
                  if (typeof n !== 'number') return;
                  if (n === character.level) return;
                  updateUndoable({ ...character, level: n }, `Set level to ${n}.`);
                }}
                className="w-10 bg-transparent text-center font-mono font-bold text-white border-none p-0 focus:ring-0"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Desktop declutter: top-level tabs to avoid 3-column overload */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <TabButton tab="sheet" activeTab={activeTab} label="Sheet" icon={<LayoutGrid className="w-4 h-4" />} onClick={setActiveTab} />
          <TabButton tab="inventory" activeTab={activeTab} label="Inventory" icon={<Backpack className="w-4 h-4" />} onClick={setActiveTab} />
          <div className="flex-1" />
          <div className="hidden md:flex items-center gap-3 text-[10px] uppercase font-bold tracking-widest text-slate-500">
            <span className="hidden lg:inline">Class:</span>
            <span className="text-slate-300 font-semibold tracking-normal">{character.class}</span>
            <span className="mx-1 text-white/10">•</span>
            <span className="hidden lg:inline">Align:</span>
            <span className="text-slate-300 font-semibold tracking-normal">{character.alignment}</span>
          </div>
        </div>

        {activeTab === 'sheet' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* LEFT: Identity & Rules */}
            <div className="xl:col-span-4 space-y-6">
              <CollapsiblePanel id="identity" title="Identity" icon={<Zap className="w-3 h-3" />} isOpen={openPanels['identity'] ?? true} onToggle={handlePanelToggle}>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] uppercase text-slate-500 font-bold">Class</label>
                    <select
                      value={character.class}
                      onChange={(e) => {
                        const nextClass = e.target.value as OSEClass;
                        if (nextClass === character.class) return;
                        updateUndoable({ ...character, class: nextClass }, `Changed class to ${nextClass}.`);
                      }}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg p-2.5 focus:border-indigo-500"
                    >
                      {CLASS_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase text-slate-500 font-bold">Alignment</label>
                    <select
                      value={character.alignment}
                      onChange={(e) => onUpdate({ ...character, alignment: e.target.value as Alignment })}
                      className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg p-2.5 focus:border-indigo-500"
                    >
                      {Object.values(Alignment).map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CollapsiblePanel>

              <CollapsiblePanel id="abilities" title="Abilities" isOpen={openPanels['abilities'] ?? true} onToggle={handlePanelToggle}>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(character.abilities) as AbilityScore[]).map((key) => (
                    <StatInput
                      key={key}
                      label={ABILITY_LABELS[key]}
                      value={character.abilities[key]}
                      onChange={(val) => handleStatChange(key, val)}
                    />
                  ))}
                </div>
              </CollapsiblePanel>

              <CollapsiblePanel id="saving-throws" title="Saving Throws" icon={<Skull className="w-3 h-3" />} isOpen={openPanels['saving-throws'] ?? false} onToggle={handlePanelToggle}>
                <div className="space-y-3">
                  {LEVEL_1_SAVES[character.class] && (
                    <div className="flex items-center justify-between gap-3 p-2 rounded-lg border border-white/5 bg-white/5">
                      <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                        Class Defaults
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const defaults = LEVEL_1_SAVES[character.class] as SavingThrows;
                          updateUndoable(
                            { ...character, savingThrows: defaults },
                            `Applied ${character.class} level 1 saving throw defaults.`
                          );
                        }}
                        className="text-[10px] uppercase font-bold tracking-widest text-indigo-300 hover:text-white px-2 py-1 rounded border border-indigo-500/30 bg-indigo-600/10 hover:bg-indigo-600/20 transition-colors"
                        title="Apply level 1 class defaults to current saving throws"
                      >
                        Apply L1 Saves
                      </button>
                    </div>
                  )}

                  <div className="space-y-2">
                  {Object.entries(character.savingThrows).map(([saveName, val]) => (
                    <div
                      key={saveName}
                      className="flex justify-between items-center p-2 hover:bg-white/5 rounded-lg transition-colors group"
                    >
                      <span className="capitalize text-sm text-slate-400 group-hover:text-white transition-colors">
                        {saveName === 'death'
                          ? 'Death / Poison'
                          : saveName === 'wands'
                            ? 'Wands'
                            : saveName === 'paralysis'
                              ? 'Paralysis'
                              : saveName === 'breath'
                                ? 'Breath'
                                : 'Spells'}
                      </span>
                      <div className="flex items-center gap-2">
                        {/* Temp Save Mod */}
                        <div className="flex flex-col items-end">
                          <input
                            type="number"
                            placeholder="±"
                            value={character.saveModifiers?.[saveName as keyof typeof character.saveModifiers] || ''}
                            onChange={(e) =>
                              onUpdate({
                                ...character,
                                saveModifiers: {
                                  ...(character.saveModifiers || {}),
                                  [saveName]: parseInt(e.target.value) || 0,
                                },
                              })
                            }
                            className={`w-8 h-6 text-center text-[10px] bg-slate-950 border rounded focus:ring-0 focus:border-cyan-500 ${
                              (character.saveModifiers?.[saveName as keyof typeof character.saveModifiers] || 0) !== 0
                                ? 'border-cyan-500/50 text-cyan-400'
                                : 'border-slate-800 text-slate-600'
                            }`}
                          />
                        </div>

                        {/* Base Save */}
                        <input
                          type="number"
                          value={val}
                          onChange={(e) =>
                            onUpdate({
                              ...character,
                              savingThrows: { ...character.savingThrows, [saveName]: parseInt(e.target.value) || 0 },
                            })
                          }
                          className="w-10 bg-slate-900 border border-slate-700 rounded text-center text-sm font-mono text-white focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                </div>
              </CollapsiblePanel>
            </div>

            {/* RIGHT: Combat & XP */}
            <div className="xl:col-span-8 space-y-6">
              {/* Combat Vitals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* HP Card */}
                <div className="glass-panel rounded-2xl p-5 relative overflow-hidden group">
                  <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Heart className="w-24 h-24 text-red-500" />
                  </div>
                  <label className="text-xs font-bold uppercase tracking-widest text-red-400 mb-2 block">Hit Points</label>
                  <div className="flex items-end gap-2 relative z-10">
                    <input
                      type="number"
                      value={character.hp}
                      onChange={(e) => onUpdate({ ...character, hp: parseInt(e.target.value) || 0 })}
                      className="w-20 bg-transparent text-5xl font-serif font-bold text-white border-none p-0 focus:ring-0 placeholder-slate-700"
                    />
                    <span className="text-2xl text-slate-500 font-serif mb-2">/</span>
                    <CommitNumberInput
                      value={character.maxHp}
                      emptyCommit="keep"
                      transform={(n) => Math.max(1, n)}
                      onCommit={(n) => {
                        if (typeof n !== 'number') return;
                        if (n === character.maxHp) return;
                        updateUndoable({ ...character, maxHp: n }, `Set max HP to ${n}.`);
                      }}
                      className="w-16 bg-transparent text-3xl font-serif text-slate-500 border-none p-0 mb-1 focus:ring-0 focus:text-white transition-colors"
                    />
                  </div>

                  {/* Temp HP Section */}
                  <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cyan-400" />
                      <span className="text-[10px] uppercase font-bold text-slate-400">Temp HP</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          onUpdate({ ...character, tempHp: Math.max(0, (character.tempHp || 0) - 1) })
                        }
                        className="text-slate-500 hover:text-white"
                      >
                        <MinusCircle className="w-4 h-4" />
                      </button>
                      <CommitNumberInput
                        value={character.tempHp ?? 0}
                        emptyCommit="keep"
                        transform={(n) => Math.max(0, n)}
                        onCommit={(n) => {
                          if (typeof n !== 'number') return;
                          if (n === (character.tempHp ?? 0)) return;
                          updateUndoable({ ...character, tempHp: n }, `Set temp HP to ${n}.`);
                        }}
                        className="w-12 text-center bg-cyan-950/30 border border-cyan-500/30 rounded text-cyan-300 font-bold focus:border-cyan-400"
                      />
                      <button
                        onClick={() => onUpdate({ ...character, tempHp: (character.tempHp || 0) + 1 })}
                        className="text-slate-500 hover:text-white"
                      >
                        <PlusCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="w-full bg-slate-800 h-1.5 mt-2 rounded-full overflow-hidden relative">
                    {(() => {
                      const maxHp = Math.max(1, character.maxHp || 1);
                      const basePct = Math.min(100, (character.hp / maxHp) * 100);
                      const tempPct =
                        character.tempHp > 0 ? Math.min(100 - basePct, (character.tempHp / maxHp) * 100) : 0;

                      return (
                        <>
                          {/* Base HP Bar */}
                          <div
                            className="h-full bg-red-500 transition-all duration-500 absolute left-0 top-0"
                            style={{ width: `${basePct}%` }}
                          ></div>

                          {/* Temp HP Overlay */}
                          {tempPct > 0 && (
                            <div
                              className="h-full bg-cyan-400 transition-all duration-500 absolute top-0 opacity-70"
                              style={{ left: `${basePct}%`, width: `${tempPct}%` }}
                            ></div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* AC Card */}
                <div className="glass-panel rounded-2xl p-5 relative overflow-hidden group flex flex-col">
                  <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Shield className="w-24 h-24 text-indigo-500" />
                  </div>
                  <label className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2 block">
                    Armor Class
                  </label>

                  <div className="flex-grow flex flex-col justify-center items-center relative z-10">
                    {/* Main AC Display */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-6xl font-serif font-bold text-white">{(character.ac || 9) + (character.acModifier || 0)}</span>
                      {(character.acModifier || 0) !== 0 && (
                        <span className="text-lg font-mono text-cyan-400 animate-pulse">(Mod)</span>
                      )}
                    </div>

                    {/* Base Value Edit */}
                    <div className="flex items-center gap-2 mt-2 opacity-60 hover:opacity-100 transition-opacity">
                      <span className="text-[10px] uppercase text-slate-500">Base</span>
                      <CommitNumberInput
                        value={character.ac}
                        emptyCommit="keep"
                        onCommit={(n) => {
                          if (typeof n !== 'number') return;
                          if (n === character.ac) return;
                          updateUndoable({ ...character, ac: n }, `Set base AC to ${n}.`);
                        }}
                        className="w-10 bg-transparent text-center border-b border-slate-600 focus:border-indigo-500 text-sm font-mono p-0"
                      />
                    </div>
                  </div>

                  {/* Temp AC Section */}
                  <div className="mt-4 pt-3 border-t border-white/5 relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Shield className="w-3 h-3 text-cyan-400" />
                        <span className="text-[10px] uppercase font-bold text-slate-400">Temp Bonus</span>
                      </div>
                      <CommitNumberInput
                        value={character.acModifier ?? 0}
                        emptyCommit={0}
                        onCommit={(n) => {
                          const next = n ?? 0;
                          if (next === (character.acModifier ?? 0)) return;
                          updateUndoable({ ...character, acModifier: next }, `Set AC modifier to ${next}.`);
                        }}
                        placeholder="0"
                        className={`w-12 text-center text-sm font-bold bg-slate-950 border rounded focus:border-cyan-500 ${
                          character.acModifier ? 'border-cyan-500/50 text-cyan-400' : 'border-slate-800 text-slate-500'
                        }`}
                      />
                    </div>
                    {/* Quick Buttons */}
                    <div className="flex justify-between gap-1">
                      <QuickModButton
                        val={0}
                        label="Clr"
                        onClick={() => updateUndoable({ ...character, acModifier: 0 }, 'Cleared AC modifier.')}
                      />
                      <div className="flex gap-1">
                        <QuickModButton
                          val={1}
                          onClick={() => onUpdate({ ...character, acModifier: (character.acModifier || 0) + 1 })}
                        />
                        <QuickModButton
                          val={2}
                          onClick={() => onUpdate({ ...character, acModifier: (character.acModifier || 0) + 2 })}
                        />
                        <QuickModButton
                          val={-1}
                          onClick={() => onUpdate({ ...character, acModifier: (character.acModifier || 0) - 1 })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* XP Banner */}
              <div className="grid grid-cols-1 gap-4">
                <div
                  onClick={() => setShowXPModal(true)}
                  className="glass-panel rounded-xl p-4 flex flex-col justify-between border-l-4 border-l-purple-500 bg-purple-500/5 cursor-pointer hover:bg-purple-500/10 transition-colors group relative"
                >
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-purple-500/20 p-1.5 rounded-md text-purple-400">
                      <Calculator className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Trophy className="w-4 h-4 text-purple-500" />
                    <span className="text-[10px] uppercase font-bold text-purple-500 tracking-widest">XP</span>
                  </div>
                  <input
                    type="number"
                    value={character.xp}
                    readOnly
                    className="bg-transparent text-3xl font-mono text-purple-400 w-full focus:ring-0 border-none p-0 cursor-pointer pointer-events-none"
                  />
                </div>
              </div>

              {/* Notes tab removed */}
            </div>
          </div>
        )}

        {/* Notes tab removed */}

        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
              <div className="text-sm text-slate-400">
                Inventory is full-width here so containers and item details have breathing room.
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('sheet')}
                className="text-[10px] uppercase font-bold tracking-widest text-slate-500 hover:text-slate-200"
              >
                Back to Sheet
              </button>
            </div>
            <InventoryManager
              containers={character.containers || []}
              otherCharacters={otherCharacters}
              onChange={handleInventoryChange}
              onUndoableChange={handleInventoryChangeUndoable}
              onTransferItem={onTransferItem}
            />
          </div>
        )}
      </div>

      {showXPModal && (
        <XPCalculatorModal
          currentXP={character.xp}
          defaultPartySize={otherCharacters.length + 1}
          onSave={(newXP) => onUpdate({ ...character, xp: newXP })}
          onClose={() => setShowXPModal(false)}
        />
      )}
    </div>
  );
};

export default CharacterEditor;
