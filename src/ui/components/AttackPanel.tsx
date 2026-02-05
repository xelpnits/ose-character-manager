import React, { useState, useMemo } from 'react';
import { Character, Item, ItemCategory, CombatLogEntry } from '../../types';
import {
  getMeleeAttackBonus,
  getRangedAttackBonus,
  getMeleeDamageBonus,
  doesAttackHit,
} from '../../domain/rules/thac0';
import { rollD20, parseAndRoll, formatRollResult } from '../../domain/rules/dice';
import { formatModifier } from '../../domain/rules/modifiers';
import { Swords, Target, Dices, ScrollText, Trash2, ChevronDown } from 'lucide-react';

interface AttackPanelProps {
  character: Character;
  onUpdate: (char: Character) => void;
}

const COMBAT_LOG_MAX = 50;

const AttackPanel: React.FC<AttackPanelProps> = ({ character, onUpdate }) => {
  const [selectedWeaponId, setSelectedWeaponId] = useState<string | null>(null);
  const [targetAC, setTargetAC] = useState<string>('9');
  const [showLog, setShowLog] = useState(false);

  // Get all equipped weapons from all containers
  const equippedWeapons = useMemo(() => {
    const weapons: Item[] = [];
    for (const container of character.containers || []) {
      for (const item of container.items) {
        if (item.isEquipped && item.category === ItemCategory.Weapon) {
          weapons.push(item);
        }
      }
    }
    return weapons;
  }, [character.containers]);

  const selectedWeapon = equippedWeapons.find((w) => w.id === selectedWeaponId);

  // Combat stats
  const meleeBonus = getMeleeAttackBonus(character);
  const rangedBonus = getRangedAttackBonus(character);
  const damageBonus = getMeleeDamageBonus(character);

  const getAttackBonus = (weapon: Item | undefined) => {
    if (!weapon) return meleeBonus;
    return weapon.isRanged ? rangedBonus : meleeBonus;
  };

  const handleAttack = () => {
    if (!selectedWeapon) return;

    const targetACNum = parseInt(targetAC, 10);
    if (Number.isNaN(targetACNum)) return;

    const attackBonus = getAttackBonus(selectedWeapon);
    const naturalRoll = rollD20();
    const attackTotal = naturalRoll + attackBonus;

    // Determine hit (ascending AC: roll + bonus >= target AC)
    const isCritical = naturalRoll === 20;
    const isFumble = naturalRoll === 1;
    const isHit = isCritical || (!isFumble && doesAttackHit(attackTotal, targetACNum));

    // Roll damage if hit
    let damageTotal: number | undefined;
    let damageRoll: string | undefined;
    if (isHit && selectedWeapon.damage) {
      const dmgResult = parseAndRoll(selectedWeapon.damage);
      if (dmgResult) {
        // Add STR bonus to melee damage
        const bonusDmg = selectedWeapon.isRanged ? 0 : damageBonus;
        damageTotal = Math.max(1, dmgResult.total + bonusDmg);
        damageRoll = formatRollResult(dmgResult) + (bonusDmg !== 0 ? ` ${formatModifier(bonusDmg)} STR` : '');
      }
    }

    // Create log entry
    const logEntry: CombatLogEntry = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: 'attack',
      weaponName: selectedWeapon.name,
      attackRoll: naturalRoll,
      attackBonus,
      attackTotal,
      targetAC: targetACNum,
      hit: isHit,
      damageRoll,
      damageTotal,
      notes: isCritical ? 'Critical Hit!' : isFumble ? 'Fumble!' : undefined,
    };

    // Update character with new log entry
    const updatedLog = [...(character.combatLog || []), logEntry].slice(-COMBAT_LOG_MAX);
    onUpdate({ ...character, combatLog: updatedLog });
  };

  const handleClearLog = () => {
    onUpdate({ ...character, combatLog: [] });
  };

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Attack Panel */}
      <div className="glass-panel rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Swords className="w-4 h-4 text-red-400" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-red-400">
            Attack
          </h2>
        </div>

        {/* Weapon Selection */}
        <div className="mb-4">
          <label className="text-[10px] uppercase text-slate-500 font-bold block mb-1">
            Equipped Weapon
          </label>
          {equippedWeapons.length === 0 ? (
            <div className="text-sm text-slate-500 italic py-2">
              No weapons equipped. Equip a weapon in Inventory first.
            </div>
          ) : (
            <select
              value={selectedWeaponId || ''}
              onChange={(e) => setSelectedWeaponId(e.target.value || null)}
              className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg p-2.5 focus:border-red-500 focus:ring-0"
            >
              <option value="">Select a weapon...</option>
              {equippedWeapons.map((weapon) => (
                <option key={weapon.id} value={weapon.id}>
                  {weapon.name}
                  {weapon.damage ? ` (${weapon.damage})` : ''}
                  {weapon.isRanged ? ' [Ranged]' : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Selected Weapon Stats */}
        {selectedWeapon && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-slate-900/50 border border-white/10 rounded-xl p-3 text-center">
              <div className="text-[10px] uppercase text-slate-500">Attack</div>
              <div className="text-xl font-bold text-white">
                {formatModifier(getAttackBonus(selectedWeapon))}
              </div>
              <div className="text-[10px] text-slate-600">
                {selectedWeapon.isRanged ? 'DEX' : 'STR'}
              </div>
            </div>
            <div className="bg-slate-900/50 border border-white/10 rounded-xl p-3 text-center">
              <div className="text-[10px] uppercase text-slate-500">Damage</div>
              <div className="text-xl font-bold text-white">
                {selectedWeapon.damage || '—'}
              </div>
              {!selectedWeapon.isRanged && damageBonus !== 0 && (
                <div className="text-[10px] text-slate-600">
                  {formatModifier(damageBonus)} STR
                </div>
              )}
            </div>
            <div className="bg-slate-900/50 border border-white/10 rounded-xl p-3 text-center col-span-2 sm:col-span-2">
              <div className="text-[10px] uppercase text-slate-500 mb-1">Target AC</div>
              <div className="flex items-center justify-center gap-2">
                <Target className="w-4 h-4 text-slate-500" />
                <input
                  type="number"
                  value={targetAC}
                  onChange={(e) => setTargetAC(e.target.value)}
                  className="w-16 bg-slate-950 border border-slate-700 rounded text-center text-lg font-bold text-white focus:border-red-500 focus:ring-0"
                />
              </div>
            </div>
          </div>
        )}

        {/* Attack Button */}
        <button
          type="button"
          onClick={handleAttack}
          disabled={!selectedWeapon}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold uppercase tracking-widest text-white bg-red-600 hover:bg-red-500 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600"
        >
          <Dices className="w-5 h-5" />
          Roll Attack
        </button>
      </div>

      {/* Combat Log */}
      <div className="glass-panel rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowLog(!showLog)}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-amber-400">
              Combat Log
            </h2>
            <span className="text-xs text-slate-500">
              ({(character.combatLog || []).length})
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-500 transition-transform ${showLog ? 'rotate-180' : ''}`}
          />
        </button>

        {showLog && (
          <div className="px-5 pb-5">
            {(character.combatLog || []).length === 0 ? (
              <div className="text-center py-4 text-slate-500 text-sm">
                No attacks recorded yet.
              </div>
            ) : (
              <>
                <div className="flex justify-end mb-2">
                  <button
                    type="button"
                    onClick={handleClearLog}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] uppercase font-bold tracking-widest text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear Log
                  </button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {[...(character.combatLog || [])]
                    .reverse()
                    .map((entry) => (
                      <div
                        key={entry.id}
                        className={`p-3 rounded-lg border ${
                          entry.hit
                            ? 'bg-green-950/30 border-green-500/30'
                            : 'bg-red-950/30 border-red-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-white">
                            {entry.weaponName}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {formatTimestamp(entry.timestamp)}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">
                          <span className="font-mono">
                            d20({entry.attackRoll})
                            {(entry.attackBonus || 0) !== 0 &&
                              ` ${formatModifier(entry.attackBonus || 0)}`}
                            {' = '}
                            <span className="font-bold text-white">
                              {entry.attackTotal}
                            </span>
                          </span>
                          {' vs AC '}
                          <span className="font-bold">{entry.targetAC}</span>
                          {' → '}
                          <span
                            className={
                              entry.hit ? 'text-green-400 font-bold' : 'text-red-400'
                            }
                          >
                            {entry.hit ? 'HIT' : 'MISS'}
                          </span>
                          {entry.notes && (
                            <span className="ml-2 text-amber-400">
                              {entry.notes}
                            </span>
                          )}
                        </div>
                        {entry.hit && entry.damageTotal !== undefined && (
                          <div className="text-xs text-slate-400 mt-1">
                            Damage:{' '}
                            <span className="font-mono text-orange-400 font-bold">
                              {entry.damageTotal}
                            </span>
                            {entry.damageRoll && (
                              <span className="text-slate-500 ml-1">
                                ({entry.damageRoll})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttackPanel;
