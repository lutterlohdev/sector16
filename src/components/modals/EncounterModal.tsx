import { motion, AnimatePresence } from 'motion/react';
import { Shield, Zap, Move, Crosshair, ChevronRight } from 'lucide-react';
import { GameState, EncounterState } from '../../types';

interface EncounterModalProps {
  state: GameState;
  encounter: EncounterState;
  totalPower: number;
  totalDefense: number;
  onAction: (action: 'attack' | 'defend' | 'avoid' | 'fly' | 'overcharge' | 'disengage') => void;
  onUseDuctTape: () => void;
  onClose: () => void;
}

/** Render shield pips as a row of filled/empty boxes */
function ShieldPips({ current, max, color }: { current: number; max: number; color: string }) {
  const pips = [];
  const displayMax = Math.max(max, current);
  for (let i = 0; i < displayMax; i++) {
    pips.push(
      <motion.div
        key={i}
        initial={i >= current ? { scale: 1.5, opacity: 0 } : false}
        animate={i >= current ? { scale: 1, opacity: 0.2 } : { scale: 1, opacity: 1 }}
        className={`w-3 h-3 border ${color} ${i < current ? (color.includes('green') ? 'bg-green-500' : color.includes('red') ? 'bg-red-500' : 'bg-white') : 'bg-transparent'}`}
      />
    );
  }
  return <div className="flex gap-1 flex-wrap">{pips}</div>;
}

/** Hit chance probability bar */
function ProbabilityBar({ chance, label, overcharged }: { chance: number; label: string; overcharged?: boolean }) {
  const pct = Math.round(chance * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] uppercase tracking-widest font-mono">
        <span className="opacity-50">{label}</span>
        <span className={`font-bold ${pct >= 60 ? 'text-green-400' : pct >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
          {pct}%{overcharged ? ' [OC]' : ''}
        </span>
      </div>
      <div className="w-full h-3 bg-red-900/50 relative overflow-hidden border border-white/10">
        <motion.div
          className={`h-full ${overcharged ? 'bg-cyan-400' : 'bg-green-500'}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

/** Charging animation overlay */
function ChargingOverlay({ isPlayerAttacking }: { isPlayerAttacking: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-10 flex items-center justify-center bg-black/80"
    >
      <div className="text-center space-y-4">
        <motion.p
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="text-[10px] uppercase tracking-[0.3em] font-mono"
        >
          {isPlayerAttacking ? 'CHARGING WEAPONS...' : 'BRACING SHIELDS...'}
        </motion.p>
        <div className="w-48 h-1 bg-white/10 mx-auto overflow-hidden">
          <motion.div
            className={`h-full ${isPlayerAttacking ? 'bg-orange-400' : 'bg-cyan-400'}`}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.2, ease: 'linear' }}
          />
        </div>
      </div>
    </motion.div>
  );
}

export default function EncounterModal({ state, encounter, totalPower, totalDefense, onAction, onUseDuctTape, onClose }: EncounterModalProps) {
  const isActive = encounter.status !== 'finished';
  const isCharging = encounter.status === 'charging';
  const isBetweenVolleys = encounter.status === 'between-volleys';
  const isPreBattle = encounter.status === 'waiting' || encounter.status === 'ambushed';
  const canDisengage = encounter.currentVolley >= 1;
  const canOvercharge = state.defense > 1 && !encounter.overcharged && encounter.isPlayerAttacking;

  const lastOutcome = encounter.lastOutcome;
  const outcomeColor = lastOutcome === 'critical' ? 'text-cyan-400' : lastOutcome === 'hit' ? 'text-green-400' : lastOutcome === 'miss' ? 'text-red-400' : '';

  return (
    <motion.div
      key="encounter-modal"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/95"
    >
      <div className="w-full max-w-md pixel-border bg-black p-8 text-center space-y-6 relative overflow-hidden">

        {/* Charging overlay */}
        <AnimatePresence>
          {isCharging && <ChargingOverlay isPlayerAttacking={encounter.isPlayerAttacking} />}
        </AnimatePresence>

        {isActive ? (
          <>
            {/* Header */}
            <div className="space-y-2">
              <h3 className="text-red-500 text-sm tracking-widest animate-pulse">
                {encounter.isAmbush && isPreBattle ? 'AMBUSH DETECTED' : encounter.currentVolley > 0 ? `VOLLEY ${encounter.currentVolley}` : 'SHIP DETECTED'}
              </h3>
              <h2 className="text-2xl font-bold uppercase">{encounter.name}</h2>
              <p className="text-xs opacity-50">
                {encounter.isAmbush && isPreBattle ? "YOU'VE BEEN ATTACKED!" : (encounter.type === 'ruin' ? 'ANCIENT GUARDIAN' : 'PIRATE VESSEL')}
              </p>
            </div>

            {/* Stats + Shield Pips */}
            <div className="grid grid-cols-2 gap-6 border-y border-white/10 py-4">
              <div className="text-left space-y-3">
                <div className="text-[10px] uppercase opacity-50 font-mono">Your Ship</div>
                <div className="flex items-baseline gap-2">
                  <Crosshair size={12} className="opacity-50" />
                  <span className="text-[10px] uppercase font-mono opacity-50">Power</span>
                  <span className="text-lg font-mono">{Math.floor(totalPower)}</span>
                </div>
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <Shield size={12} className="opacity-50" />
                    <span className="text-[10px] uppercase font-mono opacity-50">Shields</span>
                    <span className="text-lg font-mono">
                      {Math.floor(state.defense)}
                      {encounter.tempDefense ? (
                        <span className="text-sm opacity-50 ml-1">+{encounter.tempDefense}</span>
                      ) : null}
                    </span>
                  </div>
                  <ShieldPips current={state.defense + (encounter.tempDefense || 0)} max={state.defense + (encounter.tempDefense || 0)} color="border-green-500" />
                </div>
              </div>
              <div className="text-right space-y-3">
                <div className="text-[10px] uppercase opacity-50 font-mono">Other Ship</div>
                <div className="flex items-baseline gap-2 justify-end">
                  <span className="text-[10px] uppercase font-mono opacity-50">Power</span>
                  <span className="text-lg font-mono">{Math.floor(encounter.power)}</span>
                  <Crosshair size={12} className="opacity-50" />
                </div>
                <div>
                  <div className="flex items-baseline gap-2 justify-end mb-1">
                    <span className="text-[10px] uppercase font-mono opacity-50">Shields</span>
                    <span className="text-lg font-mono">{Math.floor(encounter.npcShields)}</span>
                    <Shield size={12} className="opacity-50" />
                  </div>
                  <div className="flex justify-end">
                    <ShieldPips current={encounter.npcShields} max={encounter.defense} color="border-red-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Probability Bar — shown during between-volleys and pre-battle */}
            {(isPreBattle || isBetweenVolleys) && (
              <ProbabilityBar
                chance={encounter.playerHitChance}
                label={encounter.isPlayerAttacking ? 'Hit Chance' : 'Deflect Chance'}
                overcharged={encounter.overcharged}
              />
            )}

            {/* Last volley result message */}
            {encounter.exchangeResult && (
              <motion.div
                key={encounter.exchangeResult}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`p-3 bg-white/5 border border-white/10 text-xs italic ${outcomeColor}`}
              >
                {encounter.exchangeResult}
              </motion.div>
            )}

            {/* Duct Tape — available pre-battle and between volleys */}
            {(isPreBattle || isBetweenVolleys) && !encounter.usedDuctTape && state.inventory.some(i => i.name === 'Duct Tape') && (
              <button
                onClick={onUseDuctTape}
                className="pixel-button w-full py-2 text-[10px] uppercase tracking-widest font-bold"
              >
                Apply Duct Tape (DEFENSE +1)
              </button>
            )}

            {/* Action Buttons */}
            {!isCharging && (
              <div className="grid grid-cols-1 gap-3">

                {/* Pre-battle: waiting (player initiative) */}
                {encounter.status === 'waiting' && (
                  <>
                    <button
                      onClick={() => onAction('attack')}
                      disabled={totalPower < 1}
                      className="pixel-button flex items-center justify-center gap-2 group disabled:opacity-30"
                    >
                      <Crosshair size={18} className={totalPower >= 1 ? "group-hover:animate-spin" : ""} />
                      <span>OPEN FIRE</span>
                      <ChevronRight size={14} className="opacity-30" />
                    </button>
                    {totalPower < 1 && (
                      <p className="text-[10px] text-red-500 animate-pulse">WEAPONS OFFLINE: ACQUIRE UPGRADES TO ATTACK</p>
                    )}
                    <button onClick={() => onAction('avoid')} className="pixel-button flex items-center justify-center gap-2">
                      <Move size={18} />
                      <span>AVOID ({state.hasCloakingSpell ? '100%' : (!encounter.isAmbush ? '100%' : (encounter.type === 'ruin' ? '10%' : '80%'))} CHANCE)</span>
                    </button>
                  </>
                )}

                {/* Pre-battle: ambushed (NPC initiative) */}
                {encounter.status === 'ambushed' && (
                  <>
                    <button onClick={() => onAction('defend')} className="pixel-button flex items-center justify-center gap-2">
                      <Shield size={18} />
                      <span>BRACE &amp; DEFLECT</span>
                      <ChevronRight size={14} className="opacity-30" />
                    </button>
                    <button onClick={() => onAction('avoid')} className="pixel-button flex items-center justify-center gap-2">
                      <Move size={18} />
                      <span>AVOID ({state.hasCloakingSpell ? '100%' : (encounter.type === 'ruin' ? '10%' : '80%')} CHANCE)</span>
                    </button>
                  </>
                )}

                {/* Between volleys — the core decision point */}
                {isBetweenVolleys && (
                  <>
                    {encounter.isPlayerAttacking ? (
                      <>
                        <button
                          onClick={() => onAction('attack')}
                          disabled={totalPower < 1}
                          className="pixel-button flex items-center justify-center gap-2 group disabled:opacity-30"
                        >
                          <Crosshair size={18} className={totalPower >= 1 ? "group-hover:animate-spin" : ""} />
                          <span>PRESS ATTACK</span>
                          <ChevronRight size={14} className="opacity-30" />
                        </button>
                        {canOvercharge && (
                          <button
                            onClick={() => onAction('overcharge')}
                            className="pixel-button flex items-center justify-center gap-2 text-cyan-400 border-cyan-400/30"
                          >
                            <Zap size={18} />
                            <span>OVERCHARGE (+15% HIT, -1 SHIELD)</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <button onClick={() => onAction('defend')} className="pixel-button flex items-center justify-center gap-2">
                        <Shield size={18} />
                        <span>BRACE &amp; DEFLECT</span>
                        <ChevronRight size={14} className="opacity-30" />
                      </button>
                    )}

                    {canDisengage && (
                      <button
                        onClick={() => onAction('disengage')}
                        className="pixel-button flex items-center justify-center gap-2 opacity-60 hover:opacity-100"
                      >
                        <Move size={18} />
                        <span>DISENGAGE</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Volley history ticker */}
            {encounter.volleyLog.length > 0 && (
              <div className="flex gap-2 justify-center pt-2">
                {encounter.volleyLog.map((v) => (
                  <div
                    key={v.volley}
                    className={`w-5 h-5 flex items-center justify-center text-[9px] font-mono border ${
                      v.outcome === 'critical' ? 'border-cyan-400 text-cyan-400 bg-cyan-400/10' :
                      v.outcome === 'hit' ? 'border-green-400 text-green-400 bg-green-400/10' :
                      'border-red-400 text-red-400 bg-red-400/10'
                    }`}
                    title={`Volley ${v.volley}: ${v.outcome} (${Math.round(v.hitChance * 100)}%)`}
                  >
                    {v.outcome === 'critical' ? '!!' : v.outcome === 'hit' ? '✓' : '✗'}
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Finished state */
          <div className="space-y-6">
            <h3 className="text-xl font-bold tracking-widest">ENCOUNTER RESULT</h3>
            <p className="text-sm leading-relaxed">{encounter.result}</p>

            {/* Final volley summary */}
            {encounter.volleyLog.length > 0 && (
              <div className="text-[10px] opacity-50 font-mono space-y-1">
                <p>{encounter.volleyLog.length} volley{encounter.volleyLog.length !== 1 ? 's' : ''} exchanged</p>
                <div className="flex gap-2 justify-center">
                  {encounter.volleyLog.map((v) => (
                    <span
                      key={v.volley}
                      className={
                        v.outcome === 'critical' ? 'text-cyan-400' :
                        v.outcome === 'hit' ? 'text-green-400' :
                        'text-red-400'
                      }
                    >
                      {v.outcome === 'critical' ? '!!' : v.outcome === 'hit' ? '✓' : '✗'}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button onClick={onClose} className="pixel-button w-full">CONTINUE</button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
