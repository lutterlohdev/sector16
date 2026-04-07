import { Dispatch, SetStateAction } from 'react';
import { motion } from 'motion/react';
import { Check, X } from 'lucide-react';
import { GameState } from '../../types';

interface UpgradeCenterModalProps {
  state: GameState;
  setState: Dispatch<SetStateAction<GameState | null>>;
  buyUpgrade: (type: 'cargo' | 'shields' | 'weapons' | 'storage') => void;
  repairUpgrade: (type: 'cargo' | 'weapons' | 'storage') => void;
  repairJumpDrive: () => void;
  onClose: () => void;
}

export default function UpgradeCenterModal({ state, setState, buyUpgrade, repairUpgrade, repairJumpDrive, onClose }: UpgradeCenterModalProps) {
  const basePrice = 16;
  const reqIds = [17, 23, 34];
  const hasAllInInventory = reqIds.every(id => state.inventory.some(item => item.id === id));
  const hasAllTotal = reqIds.every(id => state.inventory.some(item => item.id === id) || state.storageLocker.some(item => item.id === id));

  return (
    <motion.div
      key="upgrade-center-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black/90 backdrop-blur-sm"
    >
      <div className="w-full max-w-2xl pixel-border bg-black p-6 flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <h3 className="text-xl font-bold tracking-widest uppercase">Upgrade Center</h3>
            <span className="text-[10px] opacity-50">ADVANCED ENGINEERING FACILITY</span>
          </div>
          <button onClick={onClose} className="pixel-button py-1 px-3">CLOSE</button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 pr-2">

          {/* Warning banner for damaged systems */}
          {(state.power <= 0 || state.defense <= 0 || state.damagedUpgrades.weapons || state.jumpDriveDisabled) && (
            <div className="p-3 border border-yellow-500/30 bg-yellow-500/5">
              <p className="text-xs text-yellow-400 font-bold mb-1 uppercase tracking-tighter">Warning: Systems Compromised</p>
              <div className="text-[10px] opacity-70 italic space-y-1">
                {state.power <= 0 && <p>Weapons systems offline.</p>}
                {state.damagedUpgrades.weapons && state.power > 0 && <p className="text-yellow-400">Weapons compromised: Attack limited.</p>}
                {state.defense <= 0 && <p>Shields down.</p>}
                {state.jumpDriveDisabled && <p className="text-red-400">Jump drive offline: Navigation disabled. Repair required.</p>}
              </div>
            </div>
          )}

          {/* Ship Systems Upgrades */}
          <div className="p-4 border border-white/20 space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-widest border-b border-white/20 pb-2">Ship Systems</h4>
            {(['cargo', 'shields', 'weapons', 'storage'] as const).map(type => {
              const count = state.upgrades[type] || 0;
              const cost = Math.floor(basePrice * Math.pow(2, count));
              const isDamaged = type !== 'shields' ? state.damagedUpgrades[type as 'cargo' | 'weapons' | 'storage'] : false;
              const repairCost = Math.floor(Math.floor(basePrice * Math.pow(2, count - 1)) * 0.2);

              const displayNames: Record<string, string> = {
                cargo: 'Ship Cargo Space',
                shields: 'Shields',
                weapons: 'Weapons',
                storage: 'Locker Storage',
              };

              const capacityInfo: Record<string, string> = {
                cargo: `${state.cargoCapacity} Slots`,
                shields: `+${state.upgrades.shields} DEF`,
                weapons: `+${state.upgrades.weapons} PWR`,
                storage: `${state.storageCapacity} Slots`,
              };

              return (
                <div key={type} className="flex flex-col gap-2 p-2 border border-white/30">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-tighter">{displayNames[type]}</span>
                      <span className="text-[10px] opacity-50">LVL {count} | {capacityInfo[type]}</span>
                    </div>
                    {isDamaged && <span className="text-red-500 text-[10px] animate-pulse">DAMAGED</span>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => buyUpgrade(type)}
                      className="flex-1 pixel-button text-xs py-1"
                    >
                      UPGRADE ({cost} CR)
                    </button>
                    {isDamaged && (
                      <button
                        onClick={() => repairUpgrade(type as 'cargo' | 'weapons' | 'storage')}
                        className="flex-1 pixel-button text-xs py-1 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                      >
                        REPAIR ({repairCost} CR)
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Jump Drive Repair */}
          <div className="p-4 border border-white/20 space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-widest border-b border-white/20 pb-2">Navigation Systems</h4>
            <div className={`flex flex-col gap-2 p-2 border ${state.jumpDriveDisabled ? 'border-red-500/50 bg-red-500/5' : 'border-white/30'}`}>
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-tighter">Jump Drive</span>
                  <span className="text-[10px] opacity-50">Sector-to-sector navigation system</span>
                </div>
                {state.jumpDriveDisabled
                  ? <span className="text-red-500 text-[10px] animate-pulse font-bold uppercase">OFFLINE</span>
                  : <span className="text-green-400 text-[10px] font-bold uppercase">Online</span>
                }
              </div>
              {state.jumpDriveDisabled && (
                <button
                  onClick={repairJumpDrive}
                  className="flex-1 pixel-button text-xs py-1 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                >
                  REPAIR JUMP DRIVE (64 CR)
                </button>
              )}
            </div>
          </div>

          <div className="p-4 border border-green-500/30 bg-green-500/5 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-bold text-green-400 uppercase tracking-widest">Nocturnium Miner Upgrade</h4>
                <p className="text-xs opacity-70 mt-1">Permanently increases Nocturnium mining yield in Asteroid Belts by +2.</p>
              </div>
              {state.hasMinerUpgrade && (
                <span className="px-2 py-1 bg-green-500 text-black text-[10px] font-bold uppercase">Installed</span>
              )}
            </div>

            {!state.hasMinerUpgrade && (
              <div className="space-y-4 pt-4 border-t border-green-500/20">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Required Components:</p>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 17, name: "Functioning Relay" },
                    { id: 23, name: "Heavy Duty Cables" },
                    { id: 34, name: "Atmospheric Scrubber" }
                  ].map(req => {
                    const inInventory = state.inventory.some(item => item.id === req.id);
                    const inStorage = state.storageLocker.some(item => item.id === req.id);
                    const hasItem = inInventory || inStorage;

                    return (
                      <div key={req.id} className={`flex justify-between items-center p-2 border ${hasItem ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/30 bg-red-500/5'}`}>
                        <div className="flex items-center gap-2">
                          {hasItem ? <Check size={12} className="text-green-500" /> : <X size={12} className="text-red-500" />}
                          <span className={`text-xs ${hasItem ? 'text-white' : 'text-white/40'}`}>{req.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {inInventory && <span className="text-[8px] px-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">In Cargo</span>}
                          {inStorage && <span className="text-[8px] px-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 uppercase">In Locker</span>}
                          {!hasItem && <span className="text-[8px] px-1 bg-red-500/20 text-red-500 border border-red-500/30 uppercase">Missing</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {hasAllInInventory ? (
                  <button
                    onClick={() => {
                      setState(prev => {
                        if (!prev) return prev;
                        let nextInventory = [...prev.inventory];
                        reqIds.forEach(id => {
                          const index = nextInventory.findIndex(item => item.id === id);
                          if (index !== -1) {
                            nextInventory.splice(index, 1);
                          }
                        });
                        return { ...prev, inventory: nextInventory, hasMinerUpgrade: true };
                      });
                    }}
                    className="w-full pixel-button py-3 bg-green-500/20 border-green-500 hover:bg-green-500/40 text-green-400 font-bold uppercase tracking-widest"
                  >
                    INSTALL UPGRADE
                  </button>
                ) : hasAllTotal ? (
                  <div className="p-3 border border-yellow-500/30 bg-yellow-500/5 text-center">
                    <p className="text-[10px] text-yellow-500 uppercase font-bold">All components located, but some are in storage.</p>
                    <p className="text-[10px] opacity-70 mt-1">Retrieve all items to your cargo hold to install the upgrade.</p>
                  </div>
                ) : (
                  <div className="p-3 border border-white/10 bg-white/5 text-center">
                    <p className="text-[10px] opacity-50 uppercase font-bold">Insufficient Components</p>
                    <p className="text-[10px] opacity-30 mt-1">Scavenge the galaxy for the required parts.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-4 border border-white/10 opacity-30">
            <h4 className="text-sm font-bold uppercase tracking-widest">More Upgrades Coming Soon...</h4>
            <p className="text-[10px] mt-1">Our engineers are working on advanced hull plating and engine boosters.</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
