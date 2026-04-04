import { Zap, Shield, Package } from 'lucide-react';

interface BottomNavProps {
  totalPower: number;
  totalDefense: number;
  hasCloakingSpell: boolean;
  onCargoClick: () => void;
  encounterActive: boolean;
}

export default function BottomNav({ totalPower, totalDefense, hasCloakingSpell, onCargoClick, encounterActive }: BottomNavProps) {
  return (
    <div className="flex border-t-2 border-white bg-black">
      <button
        onClick={onCargoClick}
        disabled={encounterActive}
        className="flex-1 p-4 hover:bg-white hover:text-black flex flex-col items-center gap-1 disabled:opacity-30 disabled:hover:bg-black disabled:hover:text-white"
      >
        <Package size={20} />
        <span className="text-[10px]">CARGO</span>
      </button>
      <div className="flex-1 p-4 flex flex-col items-center gap-1">
        <div className="flex gap-4">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-white">
              <Zap size={12} className="text-yellow-400" />
              <span className="text-sm font-bold">{Math.floor(totalPower)}</span>
            </div>
            <span className="text-[8px] opacity-50 uppercase">Power</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1 text-white">
              <Shield size={12} className="text-blue-400" />
              <span className="text-sm font-bold">{Math.floor(totalDefense)}</span>
            </div>
            <span className="text-[8px] opacity-50 uppercase">Defense</span>
          </div>
          {hasCloakingSpell && (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1 text-red-500 animate-pulse">
                <Zap size={12} fill="currentColor" />
                <span className="text-sm font-bold">READY</span>
              </div>
              <span className="text-[8px] text-red-500 uppercase font-bold">Cloak</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
