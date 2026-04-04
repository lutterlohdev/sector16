import { Dispatch, SetStateAction } from 'react';
import { GameState } from '../types';

export function useTrading(
  state: GameState | null,
  setState: Dispatch<SetStateAction<GameState | null>>,
  addLog: (msg: string) => void
) {
  const sellAll = () => {
    if (!state) return;
    const oreValue = state.nocturnium * 3;
    const junkValue = state.inventory.reduce((sum, item) => sum + item.value, 0);
    const total = oreValue + junkValue;

    if (total === 0) return;

    setState(prev => prev ? ({
      ...prev,
      credits: prev.credits + total,
      nocturnium: 0,
      inventory: []
    }) : null);
    addLog(`Sold all cargo for ${total} credits.`);
  };

  const sellItem = (index: number) => {
    if (!state) return;
    const item = state.inventory[index];
    setState(prev => {
      if (!prev) return prev;
      const nextInventory = prev.inventory.filter((_, i) => i !== index);
      return {
        ...prev,
        credits: prev.credits + item.value,
        inventory: nextInventory
      };
    });
    addLog(`Sold ${item.name} for ${item.value} credits.`);
  };

  const sellNocturnium = (amount: number) => {
    if (!state || state.nocturnium < amount) return;
    const value = amount * 3;
    setState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        credits: prev.credits + value,
        nocturnium: prev.nocturnium - amount
      };
    });
    addLog(`Sold ${amount} Nocturnium for ${value} credits.`);
  };

  const buyUpgrade = (type: 'cargo' | 'shields' | 'weapons' | 'storage') => {
    if (!state) return;
    const basePrice = 16;
    const count = state.upgrades[type];

    const cost = Math.floor(basePrice * Math.pow(2, count));

    if (state.credits >= cost) {
      setState(prev => {
        if (!prev) return prev;
        const nextUpgrades = { ...prev.upgrades, [type]: prev.upgrades[type] + 1 };
        let nextPower = prev.power;
        let nextDefense = prev.defense;
        let nextCargo = prev.cargoCapacity;
        let nextStorage = prev.storageCapacity;

        if (type === 'cargo') nextCargo += 8;
        if (type === 'shields') nextDefense += 1;
        if (type === 'weapons') nextPower += 1;
        if (type === 'storage') nextStorage += 8;

        return {
          ...prev,
          credits: prev.credits - cost,
          upgrades: nextUpgrades,
          power: nextPower,
          defense: nextDefense,
          cargoCapacity: nextCargo,
          storageCapacity: nextStorage
        };
      });
      addLog(`Purchased ${type} upgrade for ${cost} credits.`);
    } else {
      addLog("Insufficient credits.");
    }
  };

  const repairUpgrade = (type: 'cargo' | 'shields' | 'weapons' | 'storage') => {
    if (!state || !state.damagedUpgrades[type]) return;
    const basePrice = 16;
    const count = state.upgrades[type];
    const currentCost = Math.floor(basePrice * Math.pow(2, count - 1));
    const repairCost = Math.floor(currentCost * 0.2);

    if (state.credits >= repairCost) {
      setState(prev => prev ? ({
        ...prev,
        credits: prev.credits - repairCost,
        damagedUpgrades: { ...prev.damagedUpgrades, [type]: false }
      }) : null);
      addLog(`Repaired ${type} systems for ${repairCost} credits.`);
    } else {
      addLog("Insufficient credits for repair.");
    }
  };

  const buyDuctTape = () => {
    if (!state) return;
    const cost = 64;
    const currentCargo = state.nocturnium + state.inventory.length;
    if (state.credits < cost) {
      addLog("Insufficient credits for Duct Tape.");
      return;
    }
    if (currentCargo >= state.cargoCapacity) {
      addLog("No cargo space for Duct Tape.");
      return;
    }

    setState(prev => prev ? ({
      ...prev,
      credits: prev.credits - cost,
      inventory: [...prev.inventory, { id: Math.random().toString(36).substr(2, 9), name: 'Duct Tape', value: 16 }]
    }) : null);
    addLog("Purchased Duct Tape.");
  };

  return { sellAll, sellItem, sellNocturnium, buyUpgrade, repairUpgrade, buyDuctTape };
}
