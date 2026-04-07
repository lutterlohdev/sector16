import { TrendingUp } from 'lucide-react';
import { GameState, Sector } from '../types';

interface TradeHubPanelProps {
  state: GameState;
  currentSector: Sector;
  sellNocturnium: (amount: number) => void;
  sellItem: (index: number) => void;
  sellAll: () => void;
  buyDuctTape: () => void;
}

export default function TradeHubPanel({
  state,
  currentSector,
  sellNocturnium,
  sellItem,
  sellAll,
  buyDuctTape,
}: TradeHubPanelProps) {
  // Warning banner logic
  const isWeaponsOffline = state.power <= 0;
  const isShieldsDown = state.defense <= 0;
  const needsWarning = isWeaponsOffline || isShieldsDown || state.damagedUpgrades.weapons || state.jumpDriveDisabled;

  return (
    <div className="space-y-4">
      {/* Status Banner */}
      {needsWarning ? (
        <div className="p-3 border border-yellow-500/30 bg-yellow-500/5 mb-4">
          <p className="text-xs text-yellow-400 font-bold mb-1 uppercase tracking-tighter">Warning: Systems Compromised</p>
          <div className="text-[10px] opacity-70 italic space-y-1">
            {isWeaponsOffline && <p>Weapons systems offline.</p>}
            {state.damagedUpgrades.weapons && !isWeaponsOffline && <p className="text-yellow-400">Weapons compromised: Attack dice limited to 1.</p>}
            {isShieldsDown && <p>Shields down.</p>}
            {state.jumpDriveDisabled && <p className="text-red-400">Jump drive offline: Cannot jump between sectors. Repair at the Upgrade Center.</p>}
            <p className="mt-2 text-white not-italic">
              Recommendation: Visit the Upgrade Center at The Nocturnal Hub to repair or upgrade your systems.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-3 border border-emerald-500/30 bg-emerald-500/5 mb-4">
          <p className="text-xs text-emerald-400 font-bold mb-1 uppercase tracking-tighter">Docking Successful</p>
          <p className="text-[10px] opacity-70 italic">Welcome to {currentSector.name}. All systems green.</p>
        </div>
      )}

      {/* Trade Terminal */}
      <div className="pixel-border bg-black/80 p-4 space-y-4">
        <div className="flex justify-between items-center border-b border-white/30 pb-2">
          <h3 className="text-sm font-bold">TRADE TERMINAL</h3>
          <TrendingUp size={16} />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>NOCTURNIUM ORE</span>
            <span>{state.nocturnium} UNITS</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => sellNocturnium(1)}
              disabled={state.nocturnium < 1}
              className="pixel-button text-[10px] py-1 disabled:opacity-30"
            >
              SELL 1 (3 CR)
            </button>
            <button
              onClick={() => sellNocturnium(state.nocturnium)}
              disabled={state.nocturnium < 1}
              className="pixel-button text-[10px] py-1 disabled:opacity-30"
            >
              SELL ALL ({state.nocturnium * 3} CR)
            </button>
          </div>
        </div>

        {state.inventory.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] opacity-50 uppercase">Inventory Items</p>
            <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
              {state.inventory.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-1 border border-white/10 text-[10px]">
                  <span className="truncate flex-1 mr-2">{item.name}</span>
                  <button
                    onClick={() => sellItem(i)}
                    className="pixel-button px-2 py-0.5 whitespace-nowrap"
                  >
                    SELL ({item.value} CR)
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={sellAll}
          disabled={state.nocturnium === 0 && state.inventory.length === 0}
          className="pixel-button w-full text-xs py-2 bg-white text-black hover:bg-white/80 disabled:opacity-30"
        >
          LIQUIDATE ALL CARGO
        </button>
      </div>

      {/* Supplies */}
      <div className="grid grid-cols-1 gap-2 mt-4">
        <p className="text-xs border-b border-white pb-1">SUPPLIES</p>
        <div className="p-2 border border-white/30 flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-sm">Duct Tape</span>
            <span className="text-[10px] opacity-50 italic">Emergency Shield Patch (+1 Def)</span>
          </div>
          <button
            onClick={buyDuctTape}
            className="pixel-button text-xs py-1 px-4"
          >
            BUY (64 CR)
          </button>
        </div>
      </div>

    </div>
  );
}
