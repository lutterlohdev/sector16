import { TrendingUp } from 'lucide-react';
import { GameState, Sector } from '../types';

interface TradeHubPanelProps {
  state: GameState;
  currentSector: Sector;
  sellNocturnium: (amount: number) => void;
  sellItem: (index: number) => void;
  sellAll: () => void;
  buyUpgrade: (type: 'cargo' | 'shields' | 'weapons' | 'storage') => void;
  repairUpgrade: (type: 'cargo' | 'shields' | 'weapons' | 'storage') => void;
  buyDuctTape: () => void;
}

export default function TradeHubPanel({
  state,
  currentSector,
  sellNocturnium,
  sellItem,
  sellAll,
  buyUpgrade,
  repairUpgrade,
  buyDuctTape,
}: TradeHubPanelProps) {
  const basePrice = 16;

  // Warning banner logic
  const weaponsCost = Math.floor(basePrice * Math.pow(2, state.upgrades.weapons));
  const shieldsCost = Math.floor(basePrice * Math.pow(2, state.upgrades.shields));
  const isWeaponsOffline = state.power <= 0;
  const isShieldsDown = state.defense <= 0;
  const needsWarning = isWeaponsOffline || isShieldsDown || state.damagedUpgrades.weapons || state.damagedUpgrades.shields;

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
            {state.damagedUpgrades.shields && !isShieldsDown && <p className="text-yellow-400">Shields compromised: Defense dice limited to 1.</p>}
            <p className="mt-2 text-white not-italic">
              {((isWeaponsOffline && state.credits >= weaponsCost) || (isShieldsDown && state.credits >= shieldsCost) || state.damagedUpgrades.weapons || state.damagedUpgrades.shields)
                ? "Recommendation: Use your credits to upgrade your systems immediately."
                : "Recommendation: Travel to the Asteroid Belt to mine Nocturnium and sell it for upgrades."}
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

      {/* Upgrades */}
      <div className="grid grid-cols-1 gap-2 mt-4">
        <p className="text-xs border-b border-white pb-1">UPGRADES</p>
        {(['cargo', 'shields', 'weapons', 'storage'] as const).map(type => {
          const count = state.upgrades[type] || 0;
          const cost = Math.floor(basePrice * Math.pow(2, count));
          const isDamaged = state.damagedUpgrades[type];
          const repairCost = Math.floor(Math.floor(basePrice * Math.pow(2, count - 1)) * 0.2);

          const displayNames = {
            cargo: 'Ship Cargo Space',
            shields: 'Shields',
            weapons: 'Weapons',
            storage: 'Locker Storage'
          };

          const capacityInfo = {
            cargo: `${state.cargoCapacity} Slots`,
            shields: `+${state.upgrades.shields} DEF`,
            weapons: `+${state.upgrades.weapons} PWR`,
            storage: `${state.storageCapacity} Slots`
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
                    onClick={() => repairUpgrade(type)}
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
    </div>
  );
}
