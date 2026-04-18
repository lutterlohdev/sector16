import { useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { GameState } from '../types';

interface UpgradeCenterPanelProps {
  state: GameState;
  buyUpgrade: (type: 'cargo' | 'shields' | 'weapons' | 'storage') => void;
  repairJumpDrive: () => void;
  installMinerUpgrade: () => void;
  installJumpDrive: (buyWithCredits: boolean) => void;
}

export default function UpgradeCenterPanel({ state, buyUpgrade, repairJumpDrive, installMinerUpgrade, installJumpDrive }: UpgradeCenterPanelProps) {
  const basePrice = 16;
  const reqIds = [17, 23, 34];
  const hasAllInInventory = reqIds.every(id => state.inventory.some(item => item.id === id));
  const hasAllTotal = reqIds.every(id =>
    state.inventory.some(item => item.id === id) || state.storageLocker.some(item => item.id === id)
  );

  const jumpReqIds = [54, 35]; // Emergency Warp Core, Solid-state Hard Drive
  const hasJumpPartsTotal = jumpReqIds.every(id =>
    state.inventory.some(item => item.id === id) || state.storageLocker.some(item => item.id === id)
  );

  const isWeaponsOffline = state.power <= 0;
  const isShieldsDown = state.defense <= 0;
  const needsWarning = isWeaponsOffline || isShieldsDown || state.jumpDriveDisabled;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      
      switch(e.key) {
        case '1': buyUpgrade('cargo'); break;
        case '2': buyUpgrade('shields'); break;
        case '3': buyUpgrade('weapons'); break;
        case '4': buyUpgrade('storage'); break;
        case '5': 
          if (!state.hasJumpDrive) {
            installJumpDrive(true);
          } else if (state.jumpDriveDisabled) {
            repairJumpDrive();
          }
          break;
        case '6': 
          if (!state.hasJumpDrive && hasJumpPartsTotal) {
            installJumpDrive(false);
          }
          break;
        case '7': 
          if (!state.hasMinerUpgrade && hasAllTotal) installMinerUpgrade(); 
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.jumpDriveDisabled, state.hasJumpDrive, state.hasMinerUpgrade, hasAllTotal, hasJumpPartsTotal, buyUpgrade, repairJumpDrive, installMinerUpgrade, installJumpDrive]);

  return (
    <div className="space-y-4">
      {/* Warning banner */}
      {needsWarning && (
        <div className="p-3 border border-yellow-500/30 bg-yellow-500/5">
          <p className="text-xs text-yellow-400 font-bold mb-1 uppercase tracking-tighter">Warning: Systems Compromised</p>
          <div className="text-[10px] opacity-70 italic space-y-1">
            {isWeaponsOffline && <p>Weapons systems offline.</p>}
            {isShieldsDown && <p>Shields down.</p>}
            {state.jumpDriveDisabled && <p className="text-red-400">Jump drive offline: Navigation disabled. Repair required.</p>}
          </div>
        </div>
      )}

      {/* Ship Systems */}
      <div className="grid grid-cols-1 gap-2">
        <p className="text-xs border-b border-white pb-1">SHIP SYSTEMS</p>
        {(['cargo', 'shields', 'weapons', 'storage'] as const).map(type => {
          const count = state.upgrades[type] || 0;
          const cost = Math.floor(basePrice * Math.pow(2, count));

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
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => buyUpgrade(type)}
                  className="flex-1 pixel-button text-xs py-1"
                >
                  [{type === 'cargo' ? '1' : type === 'shields' ? '2' : type === 'weapons' ? '3' : '4'}] UPGRADE ({cost} CR)
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Jump Drive Status / Installation */}
      <div className="grid grid-cols-1 gap-2 mt-2">
        <p className="text-xs border-b border-white pb-1">NAVIGATION SYSTEMS</p>
        
        {!state.hasJumpDrive ? (
          <div className="p-3 border border-red-500/30 bg-red-500/5 space-y-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Jump Drive Required</p>
                <p className="text-[10px] opacity-70 mt-0.5">Ship is restricted to sub-light travel.</p>
              </div>
              <span className="text-red-500 text-[10px] animate-pulse font-bold uppercase">Missing</span>
            </div>

            <div className="grid grid-cols-1 gap-2 border-t border-red-500/20 pt-3">
              <div className="space-y-2">
                <p className="text-[10px] font-bold opacity-50 uppercase">Option A: Buy Core Integration</p>
                <button
                  onClick={() => installJumpDrive(true)}
                  disabled={state.credits < 512}
                  className="w-full pixel-button text-xs py-2 disabled:opacity-30"
                >
                  [5] INSTALL FOR 512 CR
                </button>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/5">
                <p className="text-[10px] font-bold opacity-50 uppercase">Option B: Scavenge Parts</p>
                <div className="grid grid-cols-1 gap-1">
                  {[
                    { id: 54, name: "Emergency Warp Core" },
                    { id: 35, name: "Solid-state Hard Drive" },
                  ].map(req => {
                    const hasItem = state.inventory.some(item => item.id === req.id) || state.storageLocker.some(item => item.id === req.id);
                    return (
                      <div key={req.id} className={`flex justify-between items-center p-1.5 border ${hasItem ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/30 bg-red-500/5'}`}>
                        <div className="flex items-center gap-2">
                          {hasItem ? <Check size={10} className="text-green-500" /> : <X size={10} className="text-red-500" />}
                          <span className={`text-[10px] ${hasItem ? 'text-white' : 'text-white/40'}`}>{req.name}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {hasJumpPartsTotal ? (
                  <button
                    onClick={() => installJumpDrive(false)}
                    className="w-full pixel-button py-2 bg-green-500/20 border-green-500 hover:bg-green-500/40 text-green-400 font-bold uppercase tracking-widest text-xs"
                  >
                    [6] CONSTRUCT DRIVE
                  </button>
                ) : (
                  <div className="p-2 border border-white/10 bg-white/5 text-center">
                    <p className="text-[10px] opacity-50 uppercase">Missing components.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className={`p-3 border ${state.jumpDriveDisabled ? 'border-red-500/50 bg-red-500/5' : 'border-white/20 bg-white/5'} space-y-2`}>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest">Jump Drive</p>
                <p className="text-[10px] opacity-70 mt-0.5">Sector-to-sector navigation system.</p>
              </div>
              {state.jumpDriveDisabled
                ? <span className="text-red-500 text-[10px] animate-pulse font-bold uppercase">OFFLINE</span>
                : <span className="text-green-400 text-[10px] font-bold uppercase">Online</span>
              }
            </div>
            {state.jumpDriveDisabled && (
              <button
                onClick={repairJumpDrive}
                className="w-full pixel-button text-xs py-1 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
              >
                [5] REPAIR JUMP DRIVE (64 CR)
              </button>
            )}
          </div>
        )}
      </div>

      {/* Nocturnium Miner Upgrade */}
      <div className="grid grid-cols-1 gap-2 mt-2">
        <p className="text-xs border-b border-white pb-1">SPECIAL UPGRADES</p>
        <div className="p-3 border border-green-500/30 bg-green-500/5 space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-green-400 uppercase tracking-widest">Nocturnium Miner</p>
              <p className="text-[10px] opacity-70 mt-0.5">+2 Nocturnium yield in Asteroid Belts.</p>
            </div>
            {state.hasMinerUpgrade && (
              <span className="px-2 py-1 bg-green-500 text-black text-[10px] font-bold uppercase">Installed</span>
            )}
          </div>

          {!state.hasMinerUpgrade && (
            <div className="space-y-2 pt-2 border-t border-green-500/20">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Required Components:</p>
              <div className="grid grid-cols-1 gap-1">
                {[
                  { id: 17, name: "Functioning Relay" },
                  { id: 23, name: "Heavy Duty Cables" },
                  { id: 34, name: "Atmospheric Scrubber" },
                ].map(req => {
                  const inInventory = state.inventory.some(item => item.id === req.id);
                  const inStorage = state.storageLocker.some(item => item.id === req.id);
                  const hasItem = inInventory || inStorage;
                  return (
                    <div key={req.id} className={`flex justify-between items-center p-1.5 border ${hasItem ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/30 bg-red-500/5'}`}>
                      <div className="flex items-center gap-2">
                        {hasItem ? <Check size={10} className="text-green-500" /> : <X size={10} className="text-red-500" />}
                        <span className={`text-[10px] ${hasItem ? 'text-white' : 'text-white/40'}`}>{req.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {inInventory && <span className="text-[8px] px-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">Cargo</span>}
                        {inStorage && <span className="text-[8px] px-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 uppercase">Locker</span>}
                        {!hasItem && <span className="text-[8px] px-1 bg-red-500/20 text-red-500 border border-red-500/30 uppercase">Missing</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {hasAllTotal ? (
                <button
                  onClick={installMinerUpgrade}
                  className="w-full pixel-button py-2 bg-green-500/20 border-green-500 hover:bg-green-500/40 text-green-400 font-bold uppercase tracking-widest text-xs"
                >
                  [7] INSTALL UPGRADE
                </button>
              ) : (
                <div className="p-2 border border-white/10 bg-white/5 text-center">
                  <p className="text-[10px] opacity-50 uppercase">Scavenge for missing components.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
