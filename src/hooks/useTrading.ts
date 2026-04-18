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

  const repairJumpDrive = () => {
    if (!state || !state.jumpDriveDisabled) return;
    const cost = 64;
    if (state.credits >= cost) {
      setState(prev => prev ? ({
        ...prev,
        credits: prev.credits - cost,
        jumpDriveDisabled: false
      }) : null);
      addLog(`Jump drive repaired for ${cost} credits. Navigation systems restored.`);
    } else {
      addLog("Insufficient credits to repair jump drive (64 CR required).");
    }
  };

  const installMinerUpgrade = () => {
    if (!state) return;
    const reqIds = [17, 23, 34];
    if (!reqIds.every(id => state.inventory.some(item => item.id === id) || state.storageLocker.some(item => item.id === id))) {
      addLog("Missing required components.");
      return;
    }
    setState(prev => {
      if (!prev) return prev;
      let nextInventory = [...prev.inventory];
      let nextStorage = [...prev.storageLocker];
      reqIds.forEach(id => {
        const invIndex = nextInventory.findIndex(item => item.id === id);
        if (invIndex !== -1) {
          nextInventory.splice(invIndex, 1);
        } else {
          const storeIndex = nextStorage.findIndex(item => item.id === id);
          if (storeIndex !== -1) nextStorage.splice(storeIndex, 1);
        }
      });
      return { ...prev, inventory: nextInventory, storageLocker: nextStorage, hasMinerUpgrade: true };
    });
    addLog("Nocturnium Miner Upgrade installed!");
  };

  const installJumpDrive = (buyWithCredits: boolean) => {
    if (!state || state.hasJumpDrive) return;

    if (buyWithCredits) {
      const cost = 512;
      if (state.credits >= cost) {
        setState(prev => prev ? ({ ...prev, credits: prev.credits - cost, hasJumpDrive: true }) : null);
        addLog(`Jump Drive installed for ${cost} credits! Navigation systems active.`);
      } else {
        addLog(`Insufficient credits (512 CR required).`);
      }
    } else {
      const reqIds = [54, 35]; // Emergency Warp Core, Solid-state Hard Drive
      if (!reqIds.every(id => state.inventory.some(item => item.id === id) || state.storageLocker.some(item => item.id === id))) {
        addLog("Missing required components for manual installation.");
        return;
      }
      setState(prev => {
        if (!prev) return prev;
        let nextInventory = [...prev.inventory];
        let nextStorage = [...prev.storageLocker];
        reqIds.forEach(id => {
          const invIndex = nextInventory.findIndex(item => item.id === id);
          if (invIndex !== -1) {
            nextInventory.splice(invIndex, 1);
          } else {
            const storeIndex = nextStorage.findIndex(item => item.id === id);
            if (storeIndex !== -1) nextStorage.splice(storeIndex, 1);
          }
        });
        return { ...prev, inventory: nextInventory, storageLocker: nextStorage, hasJumpDrive: true };
      });
      addLog("Jump Drive constructed and installed from salvaged parts!");
    }
  };

  return { sellAll, sellItem, sellNocturnium, buyUpgrade, repairJumpDrive, installMinerUpgrade, installJumpDrive };
}
