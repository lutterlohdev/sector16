import { RefreshCcw, TrendingUp, Package } from 'lucide-react';

interface TopBarProps {
  shipName: string;
  credits: number;
  inventoryCount: number;
  nocturnium: number;
  cargoCapacity: number;
  onResetClick: () => void;
}

export default function TopBar({ shipName, credits, inventoryCount, nocturnium, cargoCapacity, onResetClick }: TopBarProps) {
  return (
    <div className="flex justify-between items-center p-3 md:p-4 border-b-2 border-white bg-black z-10">
      <div className="flex flex-col justify-center">
        <span className="text-base md:text-lg font-bold tracking-tighter truncate max-w-[120px] md:max-w-none">{shipName}</span>
      </div>
      <div className="flex gap-3 md:gap-6 text-sm">
        <button
          onClick={onResetClick}
          className="flex items-center gap-1 md:gap-2 text-red-500/50 hover:text-red-500 transition-colors text-[10px] tracking-widest"
          title="RESET GAME"
        >
          <RefreshCcw size={12} />
          <span className="hidden md:inline">RESET</span>
        </button>
        <div className="flex items-center gap-2">
          <TrendingUp size={16} />
          <span>{credits} CR</span>
        </div>
        <div className="flex items-center gap-2">
          <Package size={16} />
          <span>{inventoryCount + nocturnium}/{cargoCapacity}</span>
        </div>
      </div>
    </div>
  );
}
