import { Dispatch, SetStateAction } from 'react';
import { motion } from 'motion/react';
import { GameState } from '../../types';

interface StorageModalProps {
  state: GameState;
  setState: Dispatch<SetStateAction<GameState | null>>;
  onClose: () => void;
}

export default function StorageModal({ state, setState, onClose }: StorageModalProps) {
  return (
    <motion.div
      key="storage-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black/90 backdrop-blur-sm"
    >
      <div className="w-full max-w-2xl pixel-border bg-black p-6 flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <h3 className="text-xl font-bold tracking-widest uppercase">Storage Locker</h3>
            <span className="text-[10px] opacity-50">SECURE FACILITY - {state.storageLocker.length} / {state.storageCapacity} SLOTS</span>
          </div>
          <button autoFocus onClick={onClose} className="pixel-button py-1 px-3">CLOSE</button>
        </div>

        <div className="grid grid-cols-2 gap-6 flex-1 overflow-hidden">
          {/* Ship Cargo */}
          <div className="flex flex-col overflow-hidden">
            <p className="text-[10px] opacity-50 uppercase mb-2">Ship Cargo ({state.inventory.length} / {state.cargoCapacity})</p>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {state.inventory.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-2 border border-white/10 text-[10px]">
                  <span className="truncate flex-1 mr-2">
                    {item.name} <span className="text-yellow-500/70">({item.value} CR)</span>
                  </span>
                  <button
                    onClick={() => {
                      if (state.storageLocker.length < state.storageCapacity) {
                        setState(prev => {
                          if (!prev) return prev;
                          const nextInventory = prev.inventory.filter((_, idx) => idx !== i);
                          const nextStorage = [...prev.storageLocker, item];
                          return { ...prev, inventory: nextInventory, storageLocker: nextStorage };
                        });
                      }
                    }}
                    disabled={state.storageLocker.length >= state.storageCapacity}
                    className="pixel-button px-2 py-1 disabled:opacity-30"
                  >
                    STORE
                  </button>
                </div>
              ))}
              {state.inventory.length === 0 && <p className="text-center py-4 opacity-30 italic text-[10px]">Cargo empty.</p>}
            </div>
          </div>

          {/* Locker Contents */}
          <div className="flex flex-col overflow-hidden">
            <p className="text-[10px] opacity-50 uppercase mb-2">Locker Contents ({state.storageLocker.length} / {state.storageCapacity})</p>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {state.storageLocker.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-2 border border-blue-500/20 text-[10px]">
                  <span className="truncate flex-1 mr-2">
                    {item.name} <span className="text-yellow-500/70">({item.value} CR)</span>
                  </span>
                  <button
                    onClick={() => {
                      if (state.inventory.length + state.nocturnium < state.cargoCapacity) {
                        setState(prev => {
                          if (!prev) return prev;
                          const nextStorage = prev.storageLocker.filter((_, idx) => idx !== i);
                          const nextInventory = [...prev.inventory, item];
                          return { ...prev, inventory: nextInventory, storageLocker: nextStorage };
                        });
                      }
                    }}
                    disabled={state.inventory.length + state.nocturnium >= state.cargoCapacity}
                    className="pixel-button px-2 py-1 disabled:opacity-30"
                  >
                    RETRIEVE
                  </button>
                </div>
              ))}
              {state.storageLocker.length === 0 && <p className="text-center py-4 opacity-30 italic text-[10px]">Locker empty.</p>}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
