import { Dispatch, SetStateAction } from 'react';
import { motion } from 'motion/react';
import { GameState, DiscoveryState } from '../../types';

interface DiscoveryModalProps {
  state: GameState;
  setState: Dispatch<SetStateAction<GameState | null>>;
  discovery: DiscoveryState;
  addLog: (msg: string) => void;
  onClose: () => void;
  onShowInventory: () => void;
}

export default function DiscoveryModal({ state, setState, discovery, addLog, onClose, onShowInventory }: DiscoveryModalProps) {
  const cargoFull = state.inventory.length + state.nocturnium + (discovery.item ? 1 : (discovery.nocturniumYield || 0)) > state.cargoCapacity;

  return (
    <motion.div
      key="discovery-modal"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-[150] flex items-center justify-center p-8 bg-black/80 backdrop-blur-sm"
    >
      <div className="w-full max-w-sm pixel-border bg-black p-8 text-center space-y-6">
        <h3 className="text-xl font-bold tracking-widest text-emerald-400">{discovery.title}</h3>
        <p className="text-sm leading-relaxed">{discovery.message}</p>

        {discovery.item && (
          <div className="p-4 border border-white/20 bg-white/5 flex flex-col items-center gap-2">
            <span className="text-lg font-bold">{discovery.item.name}</span>
            <span className="text-[10px] opacity-50">VALUE: {discovery.item.value} CR</span>
          </div>
        )}

        {discovery.nocturniumYield && (
          <div className="p-4 border border-white/20 bg-white/5 flex flex-col items-center gap-2">
            <span className="text-lg font-bold">{discovery.nocturniumYield} NOCTURNIUM ORE</span>
          </div>
        )}

        {cargoFull && (
          <div className="p-3 border border-red-500/50 bg-red-500/10 space-y-1">
            <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">Cargo Hold Full</p>
            <p className="text-[9px] text-red-300/80 leading-tight">
              You'll need to drop something from your cargo hold to collect this discovery.
            </p>
          </div>
        )}

        {discovery.isHazard ? (
          <div className="flex flex-col gap-2">
            <button
              autoFocus
              onClick={onClose}
              className="pixel-button w-full py-2 bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
            >
              ACKNOWLEDGE
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <button
              autoFocus
              onClick={() => {
                const yield_ = discovery.nocturniumYield || 0;
                const item = discovery.item;
                const currentUsed = state.inventory.length + state.nocturnium;
                const spaceNeeded = item ? 1 : yield_;

                if (currentUsed + spaceNeeded > state.cargoCapacity) {
                  addLog("Cargo hold full. Must drop items to collect.");
                  onShowInventory();
                  return;
                }

                setState(prev => {
                  if (!prev) return prev;
                  return {
                    ...prev,
                    nocturnium: prev.nocturnium + yield_,
                    inventory: item ? [...prev.inventory, item] : prev.inventory
                  };
                });
                onClose();
              }}
              className="pixel-button w-full py-2 disabled:opacity-30"
            >
              {cargoFull ? 'MANAGE CARGO' : 'COLLECT'}
            </button>
            <button
              onClick={onClose}
              className="text-[10px] opacity-50 hover:opacity-100 uppercase tracking-widest"
            >
              Abandon
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
