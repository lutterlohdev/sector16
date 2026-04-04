import { motion } from 'motion/react';
import {
  Zap,
  Search,
  TrendingUp,
  Map as MapIcon,
  Skull,
  AlertTriangle,
  Archive,
  Wand2,
} from 'lucide-react';
import { GameState, Sector } from '../types';

interface MapViewProps {
  state: GameState;
  currentSector: Sector | null;
  onJumpTo: (index: number) => void;
  isJumping: boolean;
}

export default function MapView({ state, currentSector, onJumpTo, isJumping }: MapViewProps) {
  return (
    <div className="w-1/2 p-4 border-r-2 border-white overflow-hidden bg-black relative flex flex-col">
      <div className="mb-4 flex justify-between items-center px-2">
        <div>
          <h3 className="text-sm font-bold tracking-[0.2em] uppercase">{currentSector?.name}</h3>
          <p className="text-[10px] opacity-50">SECTOR {currentSector?.coords.r}.{currentSector?.coords.c} | {state.globalCoords.x}, {state.globalCoords.y}</p>
        </div>
        <div className="text-[10px] opacity-50 uppercase tracking-widest">
          {currentSector?.type}
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden pixel-border bg-[#050505]">
        {/* Grid Container - Centered on Player */}
        <motion.div
          className="absolute"
          style={{ left: '50%', top: '50%' }}
          animate={{
            x: -state.globalCoords.x * 32 - 16,
            y: -state.globalCoords.y * 32 - 16
          }}
          transition={{ type: 'spring', damping: 30, stiffness: 150 }}
        >
          {/* The 64x64 Grid */}
          <div
            className="grid"
            style={{
              gridTemplateColumns: 'repeat(64, 32px)',
              gridTemplateRows: 'repeat(64, 32px)'
            }}
          >
            {Array.from({ length: 64 * 64 }).map((_, i) => {
              const x = i % 64;
              const y = Math.floor(i / 64);
              const sX = Math.floor(x / 16);
              const sY = Math.floor(y / 16);
              const sIndex = sY * 4 + sX;
              const sector = state.map[sIndex];
              const isPlayer = state.globalCoords.x === x && state.globalCoords.y === y;
              const isCurrentSector = currentSector?.id === sIndex;

              return (
                <div
                  key={i}
                  className={`
                    w-8 h-8 border-[0.5px] border-white/5 flex items-center justify-center relative
                    ${!isCurrentSector ? 'bg-white/[0.02]' : ''}
                  `}
                >
                  {/* Sector Boundary Markers */}
                  {x % 16 === 0 && y % 16 === 0 && (
                    <div className="absolute top-0 left-0 w-full h-full border border-white/10 pointer-events-none" />
                  )}

                  {isPlayer && (
                    <div
                      className="z-10 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-transform duration-300"
                      style={{
                        transform: state.lastDirection === 'up' ? 'rotate(0deg)' :
                                   state.lastDirection === 'right' ? 'rotate(90deg)' :
                                   state.lastDirection === 'down' ? 'rotate(180deg)' :
                                   'rotate(270deg)'
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                        <path d="M12 2L4 22L12 18L20 22L12 2Z" />
                      </svg>
                    </div>
                  )}

                  {state.storageLockerCoords.x === x && state.storageLockerCoords.y === y && (
                    <Archive className="text-blue-400 z-10 animate-pulse" size={16} />
                  )}

                  {state.upgradeCenterCoords.x === x && state.upgradeCenterCoords.y === y && (
                    <TrendingUp className="text-green-400 z-10 animate-pulse" size={16} />
                  )}

                  {state.wizardCoords && state.wizardCoords.x === x && state.wizardCoords.y === y && !state.hasMetWizard && (
                    <Wand2 className="text-purple-400 z-10 animate-bounce" size={16} />
                  )}

                  {/* Sector Type Icons (Sparse) */}
                  {x % 16 === 8 && y % 16 === 8 && !isPlayer && (
                    <div className={`${sector.type === 'Trade Hub' ? 'text-emerald-400 opacity-100 scale-150' : 'opacity-20'}`}>
                      {sector.type === 'Trade Hub' && <MapIcon size={12} />}
                      {sector.type === 'Asteroid Belt' && <Zap size={12} />}
                      {sector.type === 'Ship Graveyard' && <Search size={12} />}
                      {sector.type === 'Nebula' && <AlertTriangle size={12} />}
                      {sector.type === 'Ruin Sector' && <Skull size={12} />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Map Overlay: Sector Navigation */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <div className="pixel-border bg-black/80 p-2 space-y-2">
            <p className="text-[8px] opacity-50 text-center uppercase">Jump Drive</p>
            <div className="grid grid-cols-4 gap-1">
              {state.map.map((s, i) => {
                const currentSectorIndex = Math.floor(state.globalCoords.y / 16) * 4 + Math.floor(state.globalCoords.x / 16);
                const isCurrent = currentSectorIndex === i;
                return (
                  <button
                    key={i}
                    onClick={() => onJumpTo(i)}
                    disabled={isJumping || isCurrent}
                    className={`w-6 h-6 text-[8px] flex items-center justify-center border ${isCurrent ? 'bg-white text-black' : 'border-white/30 hover:bg-white/10'}`}
                  >
                    {s.coords.r}.{s.coords.c}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
