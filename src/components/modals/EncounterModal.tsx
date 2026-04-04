import { motion } from 'motion/react';
import { Shield, Move, Crosshair } from 'lucide-react';
import { GameState, EncounterState } from '../../types';

interface EncounterModalProps {
  state: GameState;
  encounter: EncounterState;
  totalPower: number;
  totalDefense: number;
  onAction: (action: 'attack' | 'defend' | 'avoid' | 'fly') => void;
  onUseDuctTape: () => void;
  onClose: () => void;
}

export default function EncounterModal({ state, encounter, totalPower, totalDefense, onAction, onUseDuctTape, onClose }: EncounterModalProps) {
  return (
    <motion.div
      key="encounter-modal"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/95"
    >
      <div className="w-full max-w-md pixel-border bg-black p-8 text-center space-y-8">
        {encounter.status !== 'finished' ? (
          <>
            <div className="space-y-2">
              <h3 className="text-red-500 text-sm tracking-widest animate-pulse">
                {encounter.isAmbush ? 'AMBUSH DETECTED' : 'SHIP DETECTED'}
              </h3>
              <h2 className="text-2xl font-bold uppercase">{encounter.name}</h2>
              <p className="text-xs opacity-50">
                {encounter.isAmbush ? "YOU'VE BEEN ATTACKED!" : (encounter.type === 'ruin' ? 'ANCIENT GUARDIAN' : 'PIRATE VESSEL')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 border-y border-white/10 py-6">
              <div className="text-left space-y-2">
                <div className="text-[10px] uppercase opacity-50 font-mono">Your Ship</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] uppercase font-mono opacity-50">Power</span>
                  <span className="text-xl font-mono">{Math.floor(totalPower)}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] uppercase font-mono opacity-50">Shields</span>
                  <span className="text-xl font-mono">
                    {Math.floor(state.defense)}
                    {encounter.tempDefense ? (
                      <span className="text-sm opacity-50 ml-1">+{encounter.tempDefense}</span>
                    ) : null}
                  </span>
                </div>
              </div>
              <div className="text-right space-y-2">
                <div className="text-[10px] uppercase opacity-50 font-mono">Other Ship</div>
                <div className="flex items-baseline gap-2 justify-end">
                  <span className="text-[10px] uppercase font-mono opacity-50">Power</span>
                  <span className="text-xl font-mono">{Math.floor(encounter.power)}</span>
                </div>
                <div className="flex items-baseline gap-2 justify-end">
                  <span className="text-[10px] uppercase font-mono opacity-50">Shields</span>
                  <span className="text-xl font-mono">{Math.floor(encounter.defense)}</span>
                </div>
              </div>
            </div>

            {(encounter.status === 'waiting' || encounter.status === 'ambushed' || encounter.status === 'counter-attack') && !encounter.usedDuctTape && state.inventory.some(i => i.name === 'Duct Tape') && (
              <button
                onClick={onUseDuctTape}
                className="pixel-button w-full py-2 text-[10px] uppercase tracking-widest font-bold"
              >
                Apply Duct Tape (DEFENSE +1)
              </button>
            )}

            {encounter.exchangeResult && (
              <div className="p-3 bg-white/5 border border-white/10 text-[10px] italic opacity-80">
                {encounter.exchangeResult}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              {encounter.status === 'waiting' && (
                <>
                  <button
                    onClick={() => onAction('attack')}
                    disabled={totalPower < 1}
                    className="pixel-button flex items-center justify-center gap-2 group disabled:opacity-30"
                  >
                    <Crosshair size={18} className={totalPower >= 1 ? "group-hover:animate-spin" : ""} />
                    <span>ATTACK</span>
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

              {encounter.status === 'ambushed' && (
                <>
                  <button onClick={() => onAction('defend')} className="pixel-button flex items-center justify-center gap-2">
                    <Shield size={18} />
                    <span>DEFEND</span>
                  </button>
                  <button onClick={() => onAction('avoid')} className="pixel-button flex items-center justify-center gap-2">
                    <Move size={18} />
                    <span>AVOID ({state.hasCloakingSpell ? '100%' : (!encounter.isAmbush ? '100%' : (encounter.type === 'ruin' ? '10%' : '80%'))} CHANCE)</span>
                  </button>
                </>
              )}

              {encounter.status === 'counter-attack' && (
                <>
                  <button
                    onClick={() => onAction('attack')}
                    disabled={totalPower < 1}
                    className="pixel-button flex items-center justify-center gap-2 group disabled:opacity-30"
                  >
                    <Crosshair size={18} className={totalPower >= 1 ? "group-hover:animate-spin" : ""} />
                    <span>ATTACK BACK</span>
                  </button>
                  <button onClick={() => onAction('fly')} className="pixel-button flex items-center justify-center gap-2">
                    <Move size={18} />
                    <span>FLY AWAY (GUARANTEED)</span>
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <h3 className="text-xl font-bold tracking-widest">ENCOUNTER RESULT</h3>
            <p className="text-sm leading-relaxed">{encounter.result}</p>
            <button onClick={onClose} className="pixel-button w-full">CONTINUE</button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
