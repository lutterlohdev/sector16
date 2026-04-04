import { Dispatch, SetStateAction } from 'react';
import { motion } from 'motion/react';
import { Trash2 } from 'lucide-react';
import { GameState } from '../../types';
import { getRarityColor, getRarityName } from '../../utils/items';

interface InventoryModalProps {
  state: GameState;
  setState: Dispatch<SetStateAction<GameState | null>>;
  onClose: () => void;
}

export default function InventoryModal({ state, setState, onClose }: InventoryModalProps) {
  return (
    <motion.div
      key="inventory-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black/90 backdrop-blur-sm"
    >
      <div className="w-full max-w-2xl pixel-border bg-black p-6 flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold tracking-widest">CARGO HOLD</h3>
          <button onClick={onClose} className="pixel-button py-1 px-3">CLOSE</button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
          <div className="flex justify-between items-center border-b border-white pb-2">
            <div className="flex flex-col">
              <span>NOCTURNIUM ORE</span>
              <span className="text-[10px] opacity-50">{state.nocturnium} UNITS</span>
            </div>
            <div className="flex gap-2">
              {state.nocturnium > 0 && (
                <>
                  <button
                    onClick={() => setState(prev => prev ? ({ ...prev, nocturnium: prev.nocturnium - 1 }) : null)}
                    className="text-red-500 hover:bg-red-500 hover:text-white px-2 py-1 text-[8px] border border-red-500/30 uppercase tracking-tighter"
                  >
                    JETTISON 1
                  </button>
                  <button
                    onClick={() => setState(prev => prev ? ({ ...prev, nocturnium: 0 }) : null)}
                    className="text-red-500 hover:bg-red-500 hover:text-white px-2 py-1 text-[8px] border border-red-500/30 uppercase tracking-tighter"
                  >
                    JETTISON ALL
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <p className="text-xs opacity-50">SPACE JUNK ({state.inventory.length})</p>
            {state.inventory.map((item, i) => (
              <div key={i} className="flex justify-between items-center p-2 border border-white/20">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span>{item.name}</span>
                    <span className={`text-[8px] font-bold ${getRarityColor(item.value)}`}>
                      [{getRarityName(item.value)}]
                    </span>
                  </div>
                  <span className="text-[10px] opacity-50">VALUE: {item.value} CR</span>
                </div>
                <button
                  onClick={() => {
                    setState(prev => prev ? ({ ...prev, inventory: prev.inventory.filter((_, idx) => idx !== i) }) : null);
                  }}
                  className="text-red-500 hover:bg-red-500 hover:text-white p-1 flex items-center gap-1 text-[8px] border border-red-500/30 px-2 uppercase"
                >
                  <Trash2 size={12} />
                  JETTISON
                </button>
              </div>
            ))}
            {state.inventory.length === 0 && <p className="text-center py-8 opacity-30 italic">No junk collected.</p>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
