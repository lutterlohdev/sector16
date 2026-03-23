import { Dispatch, SetStateAction } from 'react';
import { motion } from 'motion/react';
import { Wand2 } from 'lucide-react';
import { GameState } from '../../types';

interface WizardModalProps {
  state: GameState;
  setState: Dispatch<SetStateAction<GameState | null>>;
  addLog: (msg: string) => void;
  onClose: () => void;
}

export default function WizardModal({ state, setState, addLog, onClose }: WizardModalProps) {
  return (
    <motion.div
      key="wizard-modal"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="fixed inset-0 z-[250] flex items-center justify-center p-8 bg-black/90 backdrop-blur-md"
    >
      <div className="w-full max-w-md pixel-border bg-black p-8 text-center space-y-6 border-purple-500/50">
        <div className="relative inline-block">
          <Wand2 className="mx-auto text-purple-400 animate-bounce" size={48} />
          <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full" />
        </div>

        <h3 className="text-xl font-bold tracking-widest text-purple-400 uppercase">The Mysterious Wizard</h3>

        {!state.hasMetWizard ? (
          <>
            <p className="text-sm leading-relaxed italic opacity-80">
              "Ah, a traveler in the mist. I seek a specific artifact to power my experiments...
              Bring me a <span className="text-emerald-400 font-bold">Hydroponics Grow Light</span>,
              and I shall grant you a Cloaking Spell. It possesses enough energy to guarantee safe passage from 5 encounters before fading."
            </p>
            <p className="text-[10px] opacity-50">
              "I must vanish now. The nebulas are my home, but I am never in one place for long.
              Traverse the clouds to find me again when you have what I require."
            </p>
            <button
              autoFocus
              onClick={() => {
                setState(prev => prev ? ({ ...prev, hasMetWizard: true, wizardCoords: null }) : null);
                onClose();
                addLog("Met the Mysterious Wizard. He seeks a Hydroponics Grow Light.");
              }}
              className="pixel-button w-full py-2 border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
            >
              "I WILL FIND IT."
            </button>
          </>
        ) : state.hasCloakingSpell ? (
          <>
            <p className="text-sm leading-relaxed italic opacity-80">
              "Ah, the spell's energy has faded. To restore its power for another 5 uses, I require an artifact of great value.
              Bring me any item worth at least <span className="text-emerald-400 font-bold">128 Credits</span>."
            </p>

            {state.inventory.some(i => i.value >= 128) ? (() => {
              const itemToTrade = state.inventory.find(i => i.value >= 128)!;
              return (
                <div className="space-y-4">
                  <div className="p-3 border border-emerald-500/30 bg-emerald-500/5">
                    <p className="text-[10px] text-emerald-400 uppercase font-bold">Item Detected: {itemToTrade.name} ({itemToTrade.value} CR)</p>
                  </div>
                  <button
                    onClick={() => {
                      setState(prev => {
                        if (!prev) return prev;
                        const itemIdx = prev.inventory.findIndex(i => i.id === itemToTrade.id);
                        const nextInv = [...prev.inventory];
                        nextInv.splice(itemIdx, 1);
                        return {
                          ...prev,
                          inventory: nextInv,
                          cloakCharges: 5,
                          wizardCoords: null
                        };
                      });
                      onClose();
                      addLog(`Exchanged ${itemToTrade.name} to recharge the Cloaking Spell!`);
                    }}
                    className="pixel-button w-full py-2 bg-purple-500/20 border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
                  >
                    EXCHANGE ITEM FOR RECHARGE
                  </button>
                </div>
              );
            })() : (
              <>
                <p className="text-xs text-red-400">You do not have any items of sufficient value.</p>
                <p className="text-[10px] opacity-50 italic">
                  "Only the finest artifacts will do... return when your cargo holds such treasures."
                </p>
                <button
                  autoFocus
                  onClick={onClose}
                  className="pixel-button w-full py-2 opacity-50"
                >
                  CONTINUE SEARCH
                </button>
              </>
            )}
          </>
        ) : (
          <>
            <p className="text-sm leading-relaxed italic opacity-80">
              "We meet again, traveler. Do you have the light I seek?"
            </p>

            {state.inventory.some(i => i.id === 39) ? (
              <div className="space-y-4">
                <div className="p-3 border border-emerald-500/30 bg-emerald-500/5">
                  <p className="text-[10px] text-emerald-400 uppercase font-bold">Item Detected: Hydroponics Grow Light</p>
                </div>
                <button
                  onClick={() => {
                    setState(prev => {
                      if (!prev) return prev;
                      const itemIdx = prev.inventory.findIndex(i => i.id === 39);
                      const nextInv = [...prev.inventory];
                      nextInv.splice(itemIdx, 1);
                      return {
                        ...prev,
                        inventory: nextInv,
                        hasCloakingSpell: true,
                        cloakCharges: 5,
                        wizardCoords: null
                      };
                    });
                    onClose();
                    addLog("Exchanged Grow Light for the Cloaking Spell!");
                  }}
                  className="pixel-button w-full py-2 bg-purple-500/20 border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
                >
                  EXCHANGE ITEM FOR SPELL
                </button>
              </div>
            ) : (
              <>
                <p className="text-xs text-red-400">You do not have the Hydroponics Grow Light.</p>
                <p className="text-[10px] opacity-50 italic">
                  "Gotta keep moving... find me again when you have the item."
                </p>
                <button
                  autoFocus
                  onClick={onClose}
                  className="pixel-button w-full py-2 opacity-50"
                >
                  CONTINUE SEARCH
                </button>
              </>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}
