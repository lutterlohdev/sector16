import { motion } from 'motion/react';
import {
  Zap,
  Search,
  TrendingUp,
  Map as MapIcon,
  Skull,
  Move,
  AlertTriangle,
  Archive,
} from 'lucide-react';
import { GameState, Sector } from '../types';
import TradeHubPanel from './TradeHubPanel';
import UpgradeCenterPanel from './UpgradeCenterPanel';

interface SectorPanelProps {
  state: GameState;
  currentSector: Sector;
  isAtStorageLocker: boolean;
  isAtUpgradeCenter: boolean;
  onShowStorage: () => void;
  sellNocturnium: (amount: number) => void;
  sellItem: (index: number) => void;
  sellAll: () => void;
  buyUpgrade: (type: 'cargo' | 'shields' | 'weapons' | 'storage') => void;
  repairUpgrade: (type: 'cargo' | 'shields' | 'weapons' | 'storage') => void;
  installMinerUpgrade: () => void;
  buyDuctTape: () => void;
}

export default function SectorPanel({
  state,
  currentSector,
  isAtStorageLocker,
  isAtUpgradeCenter,
  onShowStorage,
  sellNocturnium,
  sellItem,
  sellAll,
  buyUpgrade,
  repairUpgrade,
  installMinerUpgrade,
  buyDuctTape,
}: SectorPanelProps) {
  const isDocked = state.globalCoords.x % 16 === 8 && state.globalCoords.y % 16 === 8;

  return (
    <div className="p-6 flex-1 overflow-y-auto flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1 uppercase tracking-widest">{currentSector.name}</h2>
        <p className="text-xs opacity-70">Sector {currentSector.coords.r}.{currentSector.coords.c}</p>
      </div>

      <div className="mt-6 space-y-4">
        {currentSector.type === 'Trade Hub' && (
          <div className="space-y-4">
            {/* Endless Summer Station: Storage Locker */}
            {currentSector.name === "Endless Summer Station" && (
              <div className="space-y-4 mb-8">
                {isAtStorageLocker ? (
                  <div className="p-4 border border-blue-500/30 bg-blue-500/5 space-y-4">
                    <div className="flex justify-between items-center border-b border-blue-500/30 pb-2">
                      <p className="text-sm text-blue-400 font-bold uppercase tracking-widest">Storage Locker Access</p>
                      <Archive size={16} className="text-blue-400" />
                    </div>
                    <p className="text-[10px] opacity-70 italic">
                      A secure, non-lootable storage facility. Store your items here for safekeeping.
                    </p>
                    <button
                      onClick={onShowStorage}
                      className="w-full pixel-button py-2 text-xs bg-blue-500/20 border-blue-500/50 hover:bg-blue-500/40"
                    >
                      OPEN STORAGE LOCKER
                    </button>
                  </div>
                ) : (
                  <div className="p-6 border border-blue-500/20 bg-blue-500/5 flex flex-col items-center gap-4 text-center">
                    <div className="relative">
                      <Archive className="text-blue-400 animate-pulse" size={48} />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-400 font-bold uppercase tracking-widest">Storage Locker Detected</p>
                      <p className="text-xs opacity-60 mt-2 leading-relaxed">
                        Secure storage signature found at remote coordinates.<br/>
                        Navigate to <span className="text-white font-bold">[{state.storageLockerCoords.x % 16}, {state.storageLockerCoords.y % 16}]</span> within this sector to access your locker.
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 w-full max-w-[200px]">
                      <div className="flex justify-between text-[10px] opacity-50 uppercase">
                        <span>Distance</span>
                        <span>{Math.abs((state.storageLockerCoords.x % 16) - (state.globalCoords.x % 16)) + Math.abs((state.storageLockerCoords.y % 16) - (state.globalCoords.y % 16))} Units</span>
                      </div>
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-blue-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(0, 100 - (Math.abs((state.storageLockerCoords.x % 16) - (state.globalCoords.x % 16)) + Math.abs((state.storageLockerCoords.y % 16) - (state.globalCoords.y % 16))) * 5)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* The Nocturnal Hub: Upgrade Center */}
            {currentSector.name === "The Nocturnal Hub" && (
              <div className="space-y-4 mb-8">
                {isAtUpgradeCenter ? (
                  <div className="p-4 border border-green-500/30 bg-green-500/5 space-y-4">
                    <div className="flex justify-between items-center border-b border-green-500/30 pb-2">
                      <p className="text-sm text-green-400 font-bold uppercase tracking-widest">Upgrade Center</p>
                      <TrendingUp size={16} className="text-green-400" />
                    </div>
                    <UpgradeCenterPanel
                      state={state}
                      buyUpgrade={buyUpgrade}
                      repairUpgrade={repairUpgrade}
                      installMinerUpgrade={installMinerUpgrade}
                    />
                  </div>
                ) : (
                  <div className="p-6 border border-green-500/20 bg-green-500/5 flex flex-col items-center gap-4 text-center">
                    <div className="relative">
                      <TrendingUp className="text-green-400 animate-pulse" size={48} />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping" />
                    </div>
                    <div>
                      <p className="text-sm text-green-400 font-bold uppercase tracking-widest">Upgrade Center Detected</p>
                      <p className="text-xs opacity-60 mt-2 leading-relaxed">
                        Advanced engineering signature found at remote coordinates.<br/>
                        Navigate to <span className="text-white font-bold">[{state.upgradeCenterCoords.x % 16}, {state.upgradeCenterCoords.y % 16}]</span> within this sector to access the upgrade center.
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 w-full max-w-[200px]">
                      <div className="flex justify-between text-[10px] opacity-50 uppercase">
                        <span>Distance</span>
                        <span>{Math.abs((state.upgradeCenterCoords.x % 16) - (state.globalCoords.x % 16)) + Math.abs((state.upgradeCenterCoords.y % 16) - (state.globalCoords.y % 16))} Units</span>
                      </div>
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-green-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(0, 100 - (Math.abs((state.upgradeCenterCoords.x % 16) - (state.globalCoords.x % 16)) + Math.abs((state.upgradeCenterCoords.y % 16) - (state.globalCoords.y % 16))) * 5)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Common Trade Hub content */}
            <div className="space-y-4">
              {isDocked ? (
                <TradeHubPanel
                  state={state}
                  currentSector={currentSector}
                  sellNocturnium={sellNocturnium}
                  sellItem={sellItem}
                  sellAll={sellAll}
                  buyDuctTape={buyDuctTape}
                />
              ) : (
                <div className="p-6 border border-emerald-500/20 bg-emerald-500/5 flex flex-col items-center gap-4 text-center">
                  <div className="relative">
                    <MapIcon className="text-emerald-400 animate-pulse" size={48} />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping" />
                  </div>
                  <div>
                    <p className="text-sm text-emerald-400 font-bold uppercase tracking-widest">Trade Hub Detected</p>
                    <p className="text-xs opacity-60 mt-2 leading-relaxed">
                      Docking signature found at central coordinates.<br/>
                      Navigate to <span className="text-white font-bold">[8, 8]</span> within this sector to access {currentSector.name}.
                    </p>
                  </div>
                  <div className="flex flex-col gap-1 w-full max-w-[200px]">
                    <div className="flex justify-between text-[10px] opacity-50 uppercase">
                      <span>Distance</span>
                      <span>{Math.abs(8 - (state.globalCoords.x % 16)) + Math.abs(8 - (state.globalCoords.y % 16))} Units</span>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-emerald-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(0, 100 - (Math.abs(8 - (state.globalCoords.x % 16)) + Math.abs(8 - (state.globalCoords.y % 16))) * 5)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentSector.type === 'Asteroid Belt' && (
          <div className="p-6 border border-yellow-500/20 bg-yellow-500/5 flex flex-col items-center gap-4 text-center">
            <Zap className="text-yellow-400 animate-pulse" size={48} />
            <div>
              <p className="text-sm text-yellow-400 font-bold uppercase tracking-widest">Asteroid Belt Detected</p>
              <p className="text-xs opacity-60 mt-2 leading-relaxed">
                Move through the sector to locate rich mineral clusters.<br/>
                Nocturnium extraction is automated upon discovery.
              </p>
            </div>
          </div>
        )}

        {currentSector.type === 'The Void' && (
          <div className="p-6 border border-gray-500/20 bg-gray-500/5 flex flex-col items-center gap-4 text-center">
            <Move className="text-gray-400 opacity-50" size={48} />
            <div>
              <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Void Sector</p>
              <p className="text-xs opacity-60 mt-2 leading-relaxed">
                Vast, empty space. Low probability of encounters.<br/>
                Ideal for safe passage between systems.
              </p>
            </div>
          </div>
        )}

        {currentSector.type === 'Nebula' && (
          <div className="p-6 border border-purple-500/20 bg-purple-500/5 flex flex-col items-center gap-4 text-center">
            <AlertTriangle className="text-purple-400 animate-pulse" size={48} />
            <div>
              <p className="text-sm text-purple-400 font-bold uppercase tracking-widest">Nebula Detected</p>
              <p className="text-xs opacity-60 mt-2 leading-relaxed">
                Hazardous cosmic clouds. High radiation levels can damage shields.<br/>
                Mysterious energy signatures reported in this area.
              </p>
            </div>
          </div>
        )}

        {currentSector.type === 'Ruin Sector' && (
          <div className="p-6 border border-red-500/20 bg-red-500/5 flex flex-col items-center gap-4 text-center">
            <Skull className="text-red-500 animate-pulse" size={48} />
            <div>
              <p className="text-sm text-red-500 font-bold uppercase tracking-widest">Ruin Sector Warning</p>
              <p className="text-xs opacity-60 mt-2 leading-relaxed">
                Ancient remains. High pirate activity detected.<br/>
                <span className="text-red-400 font-bold uppercase">Critical:</span> High risk of ambush and cargo looting.
              </p>
            </div>
          </div>
        )}

        {currentSector.type === 'Ship Graveyard' && (
          <div className="p-6 border border-blue-500/20 bg-blue-500/5 flex flex-col items-center gap-4 text-center">
            <Search className="text-blue-400 animate-pulse" size={48} />
            <div>
              <p className="text-sm text-blue-400 font-bold uppercase tracking-widest">Ship Graveyard</p>
              <p className="text-xs opacity-60 mt-2 leading-relaxed">
                Extensive debris fields. High probability of finding space junk.<br/>
                Scavengers often haunt these wreckage sites.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
