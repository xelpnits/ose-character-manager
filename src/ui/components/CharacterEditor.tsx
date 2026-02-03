import React, { useEffect, useMemo, useState } from 'react';
import { Character, OSEClass, Alignment, AbilityScore, Container, Item } from '../../types';
import { ABILITY_LABELS, CLASS_OPTIONS, LEVEL_1_SAVES } from '../../constants';
import StatInput from './StatInput';
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
  ScrollText,
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

type EditorTab = 'sheet' | 'notes' | 'inventory';

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

  // Reset to the main sheet when switching characters.
  useEffect(() => {
    setActiveTab('sheet');
  }, [character.id]);

  // Auto-apply saves for level 1 if changing class
  useEffect(() => {
    if (character.level === 1 && LEVEL_1_SAVES[character.class]) {
      // Only update if saves are different to avoid infinite loops
      const currentSaves = JSON.stringify(character.savingThrows);
      const newSaves = JSON.stringify(LEVEL_1_SAVES[character.class]);
      if (currentSaves !== newSaves) {
        onUpdate({ ...character, savingThrows: LEVEL_1_SAVES[character.class] });
      }
    }
  }, [character.class, character.level]);

  const handleStatChange = (stat: AbilityScore, val: number) => {
    onUpdate({
      ...character,
      abilities: { ...character.abilities, [stat]: val },
    });
  };

  const handleStatModChange = (stat: AbilityScore, val: number) => {
    onUpdate({
      ...character,
      abilityModifiers: { ...(character.abilityModifiers || {}), [stat]: val },
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

  // Helper for quick buttons
  const QuickModButton = ({ val, onClick, label }: { val: number; onClick: () => void; label?: string }) => (
    <button
      onClick={onClick}
      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-[10px] font-bold text-slate-300 transition-colors"
    >
      {label || (val > 0 ? `+${val}` : val)}
    </button>
  );

  const TabButton = ({
    tab,
    label,
    icon,
  }: {
    tab: EditorTab;
    label: string;
    icon: React.ReactNode;
  }) => (
    <button
      type="button"
      onClick={() => setActiveTab(tab)}
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

  const CollapsiblePanel = ({
    title,
    icon,
    defaultOpen = true,
    children,
  }: {
    title: string;
    icon?: React.ReactNode;
    defaultOpen?: boolean;
    children: React.ReactNode;
  }) => (
    <details defaultOpen={defaultOpen} className="glass-panel rounded-2xl group">
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
              <input
                type="number"
                value={character.level}
                onChange={(e) => onUpdate({ ...character, level: parseInt(e.target.value) || 1 })}
                className="w-10 bg-transparent text-center font-mono font-bold text-white border-none p-0 focus:ring-0"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-2xl mx-auto p-4 md:p-6 lg:p-8">
        {/* Desktop declutter: top-level tabs to avoid 3-column overload */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <TabButton tab="sheet" label="Sheet" icon={<LayoutGrid className="w-4 h-4" />} />
          <TabButton tab="notes" label="Notes" icon={<ScrollText className="w-4 h-4" />} />
          <TabButton tab="inventory" label="Inventory" icon={<Backpack className="w-4 h-4" />} />
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
              <CollapsiblePanel title="Identity" icon={<Zap className="w-3 h-3" />} defaultOpen>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] uppercase text-slate-500 font-bold">Class</label>
                    <select
                      value={character.class}
                      onChange={(e) => onUpdate({ ...character, class: e.target.value as OSEClass })}
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

              <CollapsiblePanel title="Abilities" defaultOpen>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[9px] text-cyan-500 font-bold">± Temp Mod</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(character.abilities) as AbilityScore[]).map((key) => (
                    <StatInput
                      key={key}
                      label={ABILITY_LABELS[key]}
                      value={character.abilities[key]}
                      modifier={character.abilityModifiers?.[key] || 0}
                      onChange={(val) => handleStatChange(key, val)}
                      onModifierChange={(val) => handleStatModChange(key, val)}
                    />
                  ))}
                </div>
              </CollapsiblePanel>

              <CollapsiblePanel title="Saving Throws" icon={<Skull className="w-3 h-3" />} defaultOpen={false}>
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
                              savingThrows: { ...character.savingThrows, [saveName]: parseInt(e.target.value) },
                            })
                          }
                          className="w-10 bg-slate-900 border border-slate-700 rounded text-center text-sm font-mono text-white focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  ))}
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
                    <input
                      type="number"
                      value={character.maxHp}
                      onChange={(e) => onUpdate({ ...character, maxHp: parseInt(e.target.value) || 1 })}
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
                      <input
                        type="number"
                        value={character.tempHp || 0}
                        onChange={(e) =>
                          onUpdate({ ...character, tempHp: Math.max(0, parseInt(e.target.value) || 0) })
                        }
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
                    {/* Base HP Bar */}
                    <div
                      className="h-full bg-red-500 transition-all duration-500 absolute left-0 top-0"
                      style={{ width: `${Math.min(100, (character.hp / character.maxHp) * 100)}%` }}
                    ></div>
                    {/* Temp HP Overlay (visual hack: assumes temp hp goes 'over' max visually but separate) */}
                    {character.tempHp > 0 && (
                      <div
                        className="h-full bg-cyan-400 transition-all duration-500 absolute top-0 opacity-70"
                        style={{ left: `${Math.min(100, (character.hp / character.maxHp) * 100)}%`, width: '10%' }}
                      ></div>
                    )}
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
                      <span className="text-6xl font-serif font-bold text-white">{(character.ac || 9) - (character.acModifier || 0)}</span>
                      {(character.acModifier || 0) !== 0 && (
                        <span className="text-lg font-mono text-cyan-400 animate-pulse">(Mod)</span>
                      )}
                    </div>

                    {/* Base Value Edit */}
                    <div className="flex items-center gap-2 mt-2 opacity-60 hover:opacity-100 transition-opacity">
                      <span className="text-[10px] uppercase text-slate-500">Base</span>
                      <input
                        type="number"
                        value={character.ac}
                        onChange={(e) => onUpdate({ ...character, ac: parseInt(e.target.value) })}
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
                      <input
                        type="number"
                        value={character.acModifier || 0}
                        onChange={(e) => onUpdate({ ...character, acModifier: parseInt(e.target.value) || 0 })}
                        placeholder="0"
                        className={`w-12 text-center text-sm font-bold bg-slate-950 border rounded focus:border-cyan-500 ${
                          character.acModifier ? 'border-cyan-500/50 text-cyan-400' : 'border-slate-800 text-slate-500'
                        }`}
                      />
                    </div>
                    {/* Quick Buttons */}
                    <div className="flex justify-between gap-1">
                      <QuickModButton val={0} label="Clr" onClick={() => onUpdate({ ...character, acModifier: 0 })} />
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

              {/* Note teaser / affordance */}
              <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
                <div className="text-sm text-slate-400">
                  Notes live under the <span className="text-slate-200 font-semibold">Notes</span> tab to keep the sheet compact.
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('notes')}
                  className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold uppercase tracking-widest text-slate-200"
                >
                  Open Notes
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="glass-panel rounded-2xl p-1 min-h-[300px] flex flex-col">
            <div className="px-4 py-3 border-b border-white/5 bg-white/5 rounded-t-xl flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Chronicle & Notes</h2>
              <button
                type="button"
                onClick={() => setActiveTab('sheet')}
                className="text-[10px] uppercase font-bold tracking-widest text-slate-500 hover:text-slate-200"
              >
                Back to Sheet
              </button>
            </div>
            <textarea
              value={character.backstory}
              onChange={(e) => onUpdate({ ...character, backstory: e.target.value })}
              className="flex-grow w-full bg-transparent border-none p-4 text-slate-300 focus:ring-0 leading-relaxed font-serif text-lg resize-y min-h-[200px]"
              placeholder="The story begins here..."
            />
          </div>
        )}

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
