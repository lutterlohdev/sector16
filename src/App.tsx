/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  Shield, 
  Search, 
  Package, 
  TrendingUp, 
  Map as MapIcon, 
  Settings, 
  Trash2, 
  ChevronRight,
  AlertTriangle,
  Crosshair,
  Skull,
  Move
} from 'lucide-react';
import { GameState, Sector, SectorType, Item } from './types';
import { SECTOR_DISTRIBUTION, HUB_NAMES, SPACE_JUNK, NPC_NAMES_PREFIX, NPC_NAMES_SUFFIX } from './constants';

const STORAGE_KEY = 'sector16_save_v1';

const INITIAL_STATE: GameState = {
  shipName: '',
  credits: 50,
  nocturnium: 0,
  cargoCapacity: 10,
  power: 1,
  defense: 1,
  luck: 0,
  xp: 0,
  inventory: [],
  globalCoords: { x: 8, y: 8 },
  lastJumpTime: Date.now(),
  miningTimer: 5,
  minersCount: 1,
  upgrades: {
    cargo: 0,
    shields: 0,
    weapons: 1,
  },
  damagedUpgrades: {
    cargo: false,
    shields: false,
    weapons: false,
  },
  moveCount: 0,
};

// Generate static map
const generateMap = (): Sector[] => {
  const fixedSectors: Record<number, SectorType> = {
    0: 'Ruin Sector',   // 0,0
    15: 'Ruin Sector',  // 3,3
    6: 'Trade Hub',     // 1,2
    9: 'Trade Hub'      // 2,1
  };

  // Create pool of remaining sectors
  const pool = [...SECTOR_DISTRIBUTION];
  // Remove the fixed ones from the pool
  pool.splice(pool.indexOf('Ruin Sector'), 1);
  pool.splice(pool.indexOf('Ruin Sector'), 1);
  pool.splice(pool.indexOf('Trade Hub'), 1);
  pool.splice(pool.indexOf('Trade Hub'), 1);

  const shuffledPool = pool.sort(() => Math.random() - 0.5);
  let poolIndex = 0;
  let hubCount = 0;

  const sectors: Sector[] = [];
  for (let i = 0; i < 16; i++) {
    const type = fixedSectors[i] || shuffledPool[poolIndex++];
    let name: string = type;
    if (type === 'Trade Hub') {
      name = HUB_NAMES[hubCount++];
    }
    sectors.push({
      id: i,
      type,
      name,
      coords: { r: Math.floor(i / 4), c: i % 4 }
    });
  }
  return sectors;
};

const MAP = generateMap();

export default function App() {
  const [state, setState] = useState<GameState | null>(null);
  const [isJumping, setIsJumping] = useState(false);
  const [jumpProgress, setJumpProgress] = useState(0);
  const [showInventory, setShowInventory] = useState(false);
  const [discovery, setDiscovery] = useState<{
    title: string;
    message: string;
    item?: Item;
  } | null>(null);
  const [encounter, setEncounter] = useState<{
    name: string;
    power: number;
    defense: number;
    credits: number;
    type: 'pirate' | 'ruin';
    result?: string;
    clashResult?: string;
    hasAttacked?: boolean;
  } | null>(null);
  const [log, setLog] = useState<string[]>(["System Initialized. Welcome to Sector 16."]);

  // Keyboard listeners for sub-sector movement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!state || isJumping || encounter || showInventory) return;

      let dx = 0;
      let dy = 0;

      if (e.key === 'ArrowUp') dy = -1;
      if (e.key === 'ArrowDown') dy = 1;
      if (e.key === 'ArrowLeft') dx = -1;
      if (e.key === 'ArrowRight') dx = 1;

      if (dx !== 0 || dy !== 0) {
        moveGlobal(dx, dy);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, isJumping, encounter, showInventory]);

  const moveGlobal = (dx: number, dy: number) => {
    setState(prev => {
      if (!prev) return prev;
      const currentGlobal = prev.globalCoords || { x: 8, y: 8 };
      const newX = Math.max(0, Math.min(63, currentGlobal.x + dx));
      const newY = Math.max(0, Math.min(63, currentGlobal.y + dy));

      if (newX === currentGlobal.x && newY === currentGlobal.y) return prev;

      const sectorIndex = Math.floor(newY / 16) * 4 + Math.floor(newX / 16);
      const sector = MAP[sectorIndex];
      
      // Check for encounter chance on move - NO encounters in Trade Hubs
      let encounterChance = 0.05;
      if (sector.type === 'The Void') encounterChance = 0.1;
      if (sector.type === 'Ruin Sector') encounterChance = 0.2;
      if (sector.type === 'Trade Hub') encounterChance = 0;

      if (encounterChance > 0 && Math.random() < encounterChance) {
        setTimeout(() => triggerEncounter(sector.type === 'Ruin Sector'), 0);
      }

      // Random item discovery (Rotational Rarity)
      const nextMoveCount = prev.moveCount + 1;
      const itemIndex = nextMoveCount % SPACE_JUNK.length;
      const candidateItem = SPACE_JUNK[itemIndex];
      
      // Increased rarity: baseOdds = value / 2 (was / 4)
      // Higher value = higher baseOdds = harder to find
      const baseOdds = candidateItem.value / 2;
      
      // Sector modifier
      let sectorMultiplier = 1;
      if (sector.type === 'Ship Graveyard') sectorMultiplier = 4; // was 5
      if (sector.type === 'Ruin Sector') sectorMultiplier = 2; // was 2.5
      if (sector.type === 'Trade Hub') sectorMultiplier = 0;

      // Luck and XP bonus
      const luckBonus = (prev.luck + prev.xp * 0.0005) * 0.5; // halved XP contribution
      const successThreshold = (1 + luckBonus) * sectorMultiplier;
      
      const foundItem = (Math.random() * baseOdds < successThreshold) ? candidateItem : null;

      if (foundItem && (prev.inventory.length + prev.nocturnium < prev.cargoCapacity)) {
        setTimeout(() => setDiscovery({
          title: "DISCOVERY",
          message: `You found ${foundItem.name} drifting in the sector!`,
          item: foundItem
        }), 0);
        return {
          ...prev,
          globalCoords: { x: newX, y: newY },
          inventory: [...prev.inventory, foundItem],
          xp: prev.xp + 2,
          moveCount: nextMoveCount
        };
      }

      return {
        ...prev,
        globalCoords: { x: newX, y: newY },
        xp: prev.xp + 0.1,
        moveCount: nextMoveCount
      };
    });
  };

  // Load game
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with INITIAL_STATE to ensure new fields like subCoords are present
        setState({ ...INITIAL_STATE, ...parsed });
      } catch (e) {
        setState(INITIAL_STATE);
      }
    } else {
      setState(INITIAL_STATE);
    }
  }, []);

  // Save game
  useEffect(() => {
    if (state) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const addLog = (msg: string) => {
    setLog(prev => [msg, ...prev].slice(0, 10));
  };

  const currentSector = useMemo(() => {
    if (!state) return null;
    const sectorIndex = Math.floor(state.globalCoords.y / 16) * 4 + Math.floor(state.globalCoords.x / 16);
    return MAP[sectorIndex];
  }, [state?.globalCoords]);

  const totalPower = useMemo(() => {
    if (!state) return 0;
    return state.power;
  }, [state]);

  const totalDefense = useMemo(() => {
    if (!state) return 0;
    return state.defense;
  }, [state]);

  const totalLuck = useMemo(() => {
    if (!state) return 0;
    return state.luck;
  }, [state]);

  const jumpTo = (index: number) => {
    if (!state || isJumping) return;
    const currentSectorIndex = Math.floor(state.globalCoords.y / 16) * 4 + Math.floor(state.globalCoords.x / 16);
    if (index === currentSectorIndex) return;

    const from = MAP[currentSectorIndex].coords;
    const to = MAP[index].coords;
    const dist = Math.abs(from.r - to.r) + Math.abs(from.c - to.c);
    const duration = Math.min(dist * 2000, 8000);

    setIsJumping(true);
    setJumpProgress(0);

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setJumpProgress(progress);
      if (progress >= 1) {
        clearInterval(interval);
        completeJump(index);
      }
    }, 50);
  };

  const completeJump = (index: number) => {
    if (!state) return;

    setIsJumping(false);
    const newSector = MAP[index];
    
    setState(prev => {
      if (!prev) return prev;
      
      let nextMiningTimer = prev.miningTimer - 1;
      let nextNocturnium = prev.nocturnium;
      let nextCredits = prev.credits;
      let nextXp = prev.xp + 5;

      // Mining yield
      if (nextMiningTimer <= 0) {
        const potentialYield = prev.minersCount * 5;
        const currentUsed = prev.inventory.length + prev.nocturnium;
        const actualYield = Math.min(potentialYield, prev.cargoCapacity - currentUsed);
        
        if (actualYield > 0) {
          nextNocturnium += actualYield;
          setTimeout(() => setDiscovery({
            title: "MINING REPORT",
            message: `Your automated miners have returned with ${actualYield} units of Nocturnium Ore.${actualYield < potentialYield ? " (Cargo Full)" : ""}`
          }), 0);
        } else if (potentialYield > 0) {
          addLog("Mining yield lost: Cargo full.");
        }
        nextMiningTimer = 5;
      }

      // Nebula Damage
      if (newSector.type === 'Nebula') {
        nextXp += 10; // Extra XP for nebula navigation
        if (Math.random() < 0.2) {
          const upgrades = ['cargo', 'shields', 'weapons'] as const;
          const target = upgrades[Math.floor(Math.random() * upgrades.length)];
          if (prev.upgrades[target] > 0 && !prev.damagedUpgrades[target]) {
            addLog(`WARNING: Nebula radiation damaged ${target} systems!`);
            const sectorRow = Math.floor(index / 4);
            const sectorCol = index % 4;
            return {
              ...prev,
              globalCoords: { x: sectorCol * 16 + 8, y: sectorRow * 16 + 8 },
              miningTimer: nextMiningTimer,
              nocturnium: nextNocturnium,
              xp: nextXp,
              damagedUpgrades: { ...prev.damagedUpgrades, [target]: true }
            };
          }
        }
      }

      const sectorRow = Math.floor(index / 4);
      const sectorCol = index % 4;
      return {
        ...prev,
        globalCoords: { x: sectorCol * 16 + 8, y: sectorRow * 16 + 8 },
        miningTimer: nextMiningTimer,
        nocturnium: nextNocturnium,
        xp: nextXp
      };
    });

    // Random Encounter
    if (newSector.type === 'The Void' || newSector.type === 'Ruin Sector') {
      const chance = newSector.type === 'Ruin Sector' ? 0.8 : 0.3;
      if (Math.random() < chance) {
        triggerEncounter(newSector.type === 'Ruin Sector');
      }
    }
  };

  const triggerEncounter = (isRuin: boolean) => {
    const name = `${NPC_NAMES_PREFIX[Math.floor(Math.random() * NPC_NAMES_PREFIX.length)]} ${NPC_NAMES_SUFFIX[Math.floor(Math.random() * NPC_NAMES_SUFFIX.length)]}`;
    
    // NPC Power/Defense scales reasonably to player stats
    const pPower = state?.power || 1;
    const pDefense = state?.defense || 1;
    
    // NPC stats: Player stats ± 1, minimum 1
    const npcPower = Math.max(1, pPower + (Math.floor(Math.random() * 3) - 1));
    const npcDefense = Math.max(1, pDefense + (Math.floor(Math.random() * 3) - 1));
    
    // NPC Credits: locked to ±50% of player's current credits
    const pCredits = state?.credits || 0;
    const variance = (Math.random() * 1.0) - 0.5; // -0.5 to +0.5
    const npcCredits = Math.floor(pCredits * (1 + variance));

    setEncounter({
      name,
      power: npcPower,
      defense: npcDefense,
      credits: npcCredits,
      type: isRuin ? 'ruin' : 'pirate',
      hasAttacked: false
    });
  };

  const handleAction = (action: 'mine' | 'trade' | 'repair') => {
    if (!state || !currentSector) return;

    if (action === 'mine' && currentSector.type === 'Asteroid Belt') {
      const yield_ = Math.floor(Math.random() * 3) + 1;
      if (state.nocturnium + state.inventory.length + yield_ > state.cargoCapacity) {
        addLog("Cargo full! Cannot mine more.");
        return;
      }
      setState(prev => prev ? ({ ...prev, nocturnium: prev.nocturnium + yield_, xp: prev.xp + 2 }) : null);
      addLog(`Mined ${yield_} Nocturnium.`);
    }
  };

  const buyUpgrade = (type: 'cargo' | 'shields' | 'weapons') => {
    if (!state) return;
    const level = Math.floor(state.xp / 500);
    const basePrice = type === 'weapons' ? 100 : 50;
    const count = state.upgrades[type];
    
    // Cost resets/reduces based on level
    const effectiveCount = Math.max(0, count - (level * 2));
    const cost = Math.floor(basePrice * Math.pow(1.6, effectiveCount));

    if (state.credits >= cost) {
      setState(prev => {
        if (!prev) return prev;
        const nextUpgrades = { ...prev.upgrades, [type]: prev.upgrades[type] + 1 };
        let nextPower = prev.power;
        let nextDefense = prev.defense;
        let nextCargo = prev.cargoCapacity;

        if (type === 'cargo') nextCargo += 5;
        if (type === 'shields') nextDefense += 1; // Simple +1
        if (type === 'weapons') nextPower += 1; // Simple +1

        return {
          ...prev,
          credits: prev.credits - cost,
          upgrades: nextUpgrades,
          power: nextPower,
          defense: nextDefense,
          cargoCapacity: nextCargo,
          xp: prev.xp + 10
        };
      });
      addLog(`Purchased ${type} upgrade for ${cost} credits.`);
    } else {
      addLog("Insufficient credits.");
    }
  };

  const repairUpgrade = (type: 'cargo' | 'shields' | 'weapons') => {
    if (!state || !state.damagedUpgrades[type]) return;
    const level = Math.floor(state.xp / 500);
    const basePrice = type === 'weapons' ? 100 : 50;
    const count = state.upgrades[type];
    const effectiveCount = Math.max(0, count - (level * 2));
    const currentCost = Math.floor(basePrice * Math.pow(1.6, effectiveCount));
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
      inventory: [],
      xp: prev.xp + Math.floor(total / 10)
    }) : null);
    addLog(`Sold all cargo for ${total} credits.`);
  };

  const sellItem = (index: number) => {
    setState(prev => {
      if (!prev) return prev;
      const item = prev.inventory[index];
      const nextInventory = prev.inventory.filter((_, i) => i !== index);
      addLog(`Sold ${item.name} for ${item.value} credits.`);
      return {
        ...prev,
        credits: prev.credits + item.value,
        inventory: nextInventory,
        xp: prev.xp + Math.floor(item.value / 10)
      };
    });
  };

  const sellNocturnium = (amount: number) => {
    setState(prev => {
      if (!prev || prev.nocturnium < amount) return prev;
      const value = amount * 3;
      addLog(`Sold ${amount} Nocturnium for ${value} credits.`);
      return {
        ...prev,
        credits: prev.credits + value,
        nocturnium: prev.nocturnium - amount,
        xp: prev.xp + Math.floor(value / 10)
      };
    });
  };

  const handleEncounterAction = (action: 'attack' | 'defend' | 'avoid') => {
    if (!state || !encounter) return;

    const rollDice = (count: number) => {
      return Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1).sort((a, b) => b - a);
    };

    if (action === 'avoid') {
      const chance = encounter.type === 'ruin' ? 0.1 : 0.8;
      if (Math.random() < chance) {
        addLog("Successfully avoided the encounter.");
        setEncounter(null);
      } else {
        addLog("Failed to avoid! Forced to defend.");
        handleEncounterAction('defend');
      }
      return;
    }

    if (action === 'attack') {
      // Flee Check: After the initial attack, 10% chance to flee
      if (encounter.hasAttacked && Math.random() < 0.1) {
        const msg = `${encounter.name} warped out! The encounter ended instantly.`;
        addLog(msg);
        setEncounter(prev => prev ? { ...prev, result: msg } : null);
        return;
      }

      // Clash: Power dice vs Defense dice
      // Stat level (including XP bonus) determines dice count
      const playerDiceCount = Math.min(Math.floor(totalPower), 3);
      const npcDiceCount = Math.min(Math.floor(encounter.defense), 2);
      
      const pDice = rollDice(playerDiceCount);
      const nDice = rollDice(npcDiceCount);
      
      const comparisons = Math.min(playerDiceCount, npcDiceCount);
      let pWins = 0;
      let nWins = 0;
      
      for (let i = 0; i < comparisons; i++) {
        if (pDice[i] > nDice[i]) pWins++;
        else nWins++; // Ties go to defender
      }

      // Update Player stats: +1 Power per win, -1 Power per loss
      let pWinsLocal = pWins;
      let nWinsLocal = nWins;
      setState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          power: Math.max(1, prev.power + pWinsLocal - nWinsLocal),
          xp: prev.xp + (pWinsLocal * 10)
        };
      });

      // Update NPC stats
      setEncounter(prev => {
        if (!prev) return prev;
        const nextDefense = Math.max(0, prev.defense - pWinsLocal);
        const clashMsg = `Clash: You rolled [${pDice.join(',')}] vs Enemy [${nDice.join(',')}]. You won ${pWinsLocal} comparisons.`;
        
        if (nextDefense <= 0) {
          // Win and loot ship
          const loot = prev.credits;
          let foundItem = null;
          if (Math.random() < (prev.type === 'ruin' ? 0.8 : 0.3)) {
             const candidate = SPACE_JUNK[Math.floor(Math.random() * SPACE_JUNK.length)];
             const baseOdds = candidate.value / 4;
             const luckBonus = (totalLuck + state.xp * 0.001) * 0.5;
             const successThreshold = (1 + luckBonus) * 2; // Combat bonus
             if (Math.random() * baseOdds < successThreshold) {
                foundItem = candidate;
             }
          }

          // Deferred state update for loot
          setTimeout(() => {
            setState(s => {
              if (!s) return s;
              const nextInventory = foundItem && (s.inventory.length + s.nocturnium) < s.cargoCapacity 
                ? [...s.inventory, foundItem] 
                : s.inventory;
              return {
                ...s,
                credits: s.credits + loot,
                inventory: nextInventory,
                xp: s.xp + 100
              };
            });
          }, 0);

          const msg = `VICTORY! You destroyed ${prev.name} and looted ${loot} credits.${foundItem ? ` Salvaged: ${foundItem.name}` : ''}`;
          addLog(msg);
          return { ...prev, defense: 0, result: msg, clashResult: clashMsg };
        }

        return { ...prev, defense: nextDefense, hasAttacked: true, clashResult: clashMsg };
      });

      addLog(`Attack: You rolled [${pDice.join(',')}] vs Enemy [${nDice.join(',')}]. You won ${pWinsLocal} clashes.`);
      return;
    }

    if (action === 'defend') {
      // Clash: NPC Power dice vs Player Defense dice
      const npcDiceCount = Math.min(Math.floor(encounter.power), 3);
      const playerDiceCount = Math.min(Math.floor(totalDefense), 2);
      
      const nDice = rollDice(npcDiceCount);
      const pDice = rollDice(playerDiceCount);
      
      const comparisons = Math.min(npcDiceCount, playerDiceCount);
      let nWinsLocal = 0;
      let pWinsLocal = 0;
      
      for (let i = 0; i < comparisons; i++) {
        if (nDice[i] > pDice[i]) nWinsLocal++;
        else pWinsLocal++; // Ties go to defender
      }

      // Update NPC stats: NPC loses 1 Power point per player win
      setEncounter(prev => {
        if (!prev) return prev;
        const nextPower = Math.max(0, prev.power - pWinsLocal);
        const clashMsg = `Defense: Enemy rolled [${nDice.join(',')}] vs You [${pDice.join(',')}]. You lost ${nWinsLocal} Defense.`;
        if (nextPower <= 0) {
          const msg = `SURVIVAL! You drove off ${prev.name}. No rewards given.`;
          addLog(msg);
          return { ...prev, power: 0, result: msg, clashResult: clashMsg };
        }
        return { ...prev, power: nextPower, clashResult: clashMsg };
      });

      // Update Player stats: Player loses 1 Defense point per NPC win
      setState(prev => {
        if (!prev) return prev;
        const nextDefense = prev.defense - nWinsLocal;
        
        if (nextDefense <= 0) {
          // Death State: Reset stats, teleport to Trade Hub, lose credits
          const tradeHub = MAP.find(s => s.type === 'Trade Hub');
          const hubCoords = tradeHub ? { x: tradeHub.coords.c * 16 + 8, y: tradeHub.coords.r * 16 + 8 } : { x: 8, y: 8 };
          
          // Keep Rare Space Junk (value >= 256)
          const nextInventory = prev.inventory.filter(item => item.value >= 256);
          const nextCredits = Math.floor(prev.credits * 0.1);

          setTimeout(() => {
            const msg = `LOOTED! Your ship was disabled. You were towed to ${tradeHub?.name || 'Trade Hub'}. Stats reset. 90% credits lost.`;
            addLog(msg);
            setEncounter(e => e ? { ...e, result: msg } : null);
          }, 0);

          return {
            ...prev,
            power: 1,
            defense: 1,
            credits: nextCredits,
            inventory: nextInventory,
            globalCoords: hubCoords,
            upgrades: { cargo: 0, shields: 0, weapons: 1 },
            damagedUpgrades: { cargo: false, shields: false, weapons: false },
            cargoCapacity: 10,
            luck: 0,
            xp: Math.floor(prev.xp * 0.5) // Optional: lose some XP too
          };
        }

        return { ...prev, defense: nextDefense };
      });

      addLog(`Defense: Enemy rolled [${nDice.join(',')}] vs You [${pDice.join(',')}]. You lost ${nWinsLocal} Defense.`);
      return;
    }
  };

  if (!state) return <div className="flex items-center justify-center h-screen bg-black text-white font-mono">LOADING...</div>;

  if (state.shipName === '') {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white font-mono p-8 crt">
        <h1 className="text-4xl mb-8 tracking-widest flicker">SECTOR 16</h1>
        <div className="pixel-border p-8 w-full max-w-md bg-black">
          <p className="mb-4">IDENTIFY YOUR VESSEL:</p>
          <input 
            type="text" 
            className="w-full bg-black border-2 border-white p-2 mb-4 outline-none focus:bg-white focus:text-black"
            placeholder="SHIP NAME..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const name = (e.target as HTMLInputElement).value.trim();
                if (name) setState({ ...state, shipName: name });
              }
            }}
          />
          <p className="text-xs opacity-50">PRESS ENTER TO INITIALIZE</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white font-mono overflow-hidden crt">
      {/* Top Bar */}
      <div className="flex justify-between items-center p-4 border-b-2 border-white bg-black z-10">
        <div className="flex flex-col">
          <span className="text-lg font-bold tracking-tighter">{state.shipName}</span>
          <span className="text-xs opacity-70">XP: {Math.floor(state.xp)}</span>
        </div>
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} />
            <span>{state.credits} CR</span>
          </div>
          <div className="flex items-center gap-2">
            <Package size={16} />
            <span>{state.inventory.length + state.nocturnium}/{state.cargoCapacity}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Jump Animation Overlay */}
        <AnimatePresence>
          {isJumping && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden"
            >
              <div className="starfield absolute inset-0 opacity-50" />
              <motion.div 
                animate={{ 
                  y: [0, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ repeat: Infinity, duration: 0.5 }}
                className="ship-pixel relative z-10 pixel-border"
              />
              <div className="mt-8 pixel-border p-4 bg-black relative z-10 w-64">
                <p className="text-xs mb-2 text-center tracking-widest">JUMPING...</p>
                <div className="h-2 w-full border border-white relative overflow-hidden">
                  <motion.div 
                    className="h-full bg-white"
                    initial={{ width: 0 }}
                    animate={{ width: `${jumpProgress * 100}%` }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Giant Map View */}
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
                x: -state.globalCoords.x * 32 - 16, // -16 to center the 32px cell
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
                  const sector = MAP[sIndex];
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
                          className="w-4 h-4 bg-white rotate-45 z-10 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                        />
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
                  {MAP.map((s, i) => {
                    const currentSectorIndex = Math.floor(state.globalCoords.y / 16) * 4 + Math.floor(state.globalCoords.x / 16);
                    const isCurrent = currentSectorIndex === i;
                    return (
                      <button
                        key={i}
                        onClick={() => jumpTo(i)}
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

        {/* Right Panel: Sector Details & Actions */}
        <div className="w-1/2 flex flex-col bg-black">
          <div className="p-6 flex-1 overflow-y-auto flex flex-col">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-1 uppercase tracking-widest">{currentSector?.name}</h2>
              <p className="text-xs opacity-70">Sector {currentSector?.coords.r}.{currentSector?.coords.c}</p>
            </div>
            
            <div className="mt-6 space-y-4">
              {currentSector?.type === 'Trade Hub' && (
                <div className="space-y-4">
                  {state.globalCoords.x % 16 === 8 && state.globalCoords.y % 16 === 8 ? (
                    <div className="space-y-4">
                      <div className="p-3 border border-emerald-500/30 bg-emerald-500/5 mb-4">
                        <p className="text-xs text-emerald-400 font-bold mb-1 uppercase tracking-tighter">Docking Successful</p>
                        <p className="text-[10px] opacity-70 italic">Welcome to {currentSector.name}. All systems green.</p>
                      </div>

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
                      
                      <div className="grid grid-cols-1 gap-2 mt-4">
                        <p className="text-xs border-b border-white pb-1">UPGRADES</p>
                        {(['cargo', 'shields', 'weapons'] as const).map(type => {
                          const level = Math.floor(state.xp / 500);
                          const basePrice = type === 'weapons' ? 100 : 50;
                          const count = state.upgrades[type];
                          const effectiveCount = Math.max(0, count - (level * 2));
                          const cost = Math.floor(basePrice * Math.pow(1.6, effectiveCount));
                          const isDamaged = state.damagedUpgrades[type];
                          const repairCost = Math.floor(cost * 0.2);

                          return (
                            <div key={type} className="flex flex-col gap-2 p-2 border border-white/30">
                              <div className="flex justify-between items-center">
                                <span className="capitalize">{type} (LVL {state.upgrades[type]})</span>
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
              )}

              {currentSector?.type === 'Asteroid Belt' && (
                <button onClick={() => handleAction('mine')} className="pixel-button w-full flex items-center justify-between">
                  <span>EXTRACT NOCTURNIUM</span>
                  <Zap size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Log */}
          <div className="h-40 border-t-2 border-white p-4 bg-black/80 overflow-y-auto text-[10px] space-y-1">
            {log.map((m, i) => (
              <div key={i} className={i === 0 ? 'text-white' : 'opacity-40'}>
                {`> ${m}`}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="flex border-t-2 border-white bg-black">
        <button onClick={() => setShowInventory(true)} className="flex-1 p-4 hover:bg-white hover:text-black flex flex-col items-center gap-1">
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
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showInventory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/90 backdrop-blur-sm"
          >
            <div className="w-full max-w-2xl pixel-border bg-black p-6 flex flex-col max-h-[80vh]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold tracking-widest">CARGO HOLD</h3>
                <button onClick={() => setShowInventory(false)} className="pixel-button py-1 px-3">CLOSE</button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-4">
                <div className="flex justify-between border-b border-white pb-2">
                  <span>NOCTURNIUM ORE</span>
                  <span>{state.nocturnium} UNITS</span>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                  <p className="text-xs opacity-50">SPACE JUNK ({state.inventory.length})</p>
                  {state.inventory.map((item, i) => {
                    const getRarityColor = (val: number) => {
                      if (val >= 1024) return 'text-orange-500';
                      if (val >= 512) return 'text-purple-500';
                      if (val >= 256) return 'text-blue-500';
                      if (val >= 128) return 'text-green-500';
                      return 'text-gray-400';
                    };
                    const getRarityName = (val: number) => {
                      if (val >= 1024) return 'LEGENDARY';
                      if (val >= 512) return 'EPIC';
                      if (val >= 256) return 'RARE';
                      if (val >= 128) return 'UNCOMMON';
                      return 'COMMON';
                    };

                    return (
                      <div key={i} className="flex justify-between items-center p-2 border border-white/20">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span>{item.name}</span>
                            <span className={`text-[8px] font-bold ${getRarityColor(item.value)}`}>
                              [{getRarityName(item.value)}]
                            </span>
                          </div>
                          <span className="text-[10px] opacity-50">VALUE: {item.value} CR</span>
                        </div>
                        <button 
                          onClick={() => {
                            setState(prev => prev ? ({ ...prev, inventory: prev.inventory.filter((_, idx) => idx !== i) }) : null);
                          }}
                          className="text-red-500 hover:bg-red-500 hover:text-white p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                  {state.inventory.length === 0 && <p className="text-center py-8 opacity-30 italic">No junk collected.</p>}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {discovery && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-8 bg-black/80 backdrop-blur-sm"
          >
            <div className="w-full max-w-sm pixel-border bg-black p-8 text-center space-y-6">
              <h3 className="text-xl font-bold tracking-widest text-emerald-400">{discovery.title}</h3>
              <p className="text-sm leading-relaxed">{discovery.message}</p>
              
              {discovery.item && (
                <div className="p-4 border border-white/20 bg-white/5 flex flex-col items-center gap-2">
                  <span className="text-lg font-bold">{discovery.item.name}</span>
                  <span className="text-[10px] opacity-50">VALUE: {discovery.item.value} CR</span>
                </div>
              )}
              
              <button 
                onClick={() => setDiscovery(null)} 
                className="pixel-button w-full py-2"
              >
                ACKNOWLEDGE
              </button>
            </div>
          </motion.div>
        )}

        {encounter && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/95"
          >
            <div className="w-full max-w-md pixel-border bg-black p-8 text-center space-y-8">
              {!encounter.result ? (
                <>
                  <div className="space-y-2">
                    <h3 className="text-red-500 text-sm tracking-widest animate-pulse">ENCOUNTER DETECTED</h3>
                    <h2 className="text-2xl font-bold uppercase">{encounter.name}</h2>
                    <p className="text-xs opacity-50">{encounter.type === 'ruin' ? 'ANCIENT GUARDIAN' : 'PIRATE VESSEL'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/20">
                    <div className="space-y-2 border-r border-white/10">
                      <p className="text-[8px] opacity-50 uppercase">Your Stats</p>
                      <div className="flex justify-between px-2">
                        <span className="text-[10px]">PWR (DICE)</span>
                        <span className="text-sm font-bold">{Math.min(Math.floor(totalPower), 3)}</span>
                      </div>
                      <div className="flex justify-between px-2">
                        <span className="text-[10px]">DEF (DICE)</span>
                        <span className="text-sm font-bold">{Math.min(Math.floor(totalDefense), 2)}</span>
                      </div>
                      <div className="flex justify-between px-2 pt-1 border-t border-white/5">
                        <span className="text-[8px] opacity-50">TOTAL PWR</span>
                        <span className="text-[10px] font-bold">{Math.floor(totalPower)}</span>
                      </div>
                      <div className="flex justify-between px-2">
                        <span className="text-[8px] opacity-50">TOTAL DEF</span>
                        <span className="text-[10px] font-bold">{Math.floor(totalDefense)}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[8px] opacity-50 uppercase">Enemy Stats</p>
                      <div className="flex justify-between px-2">
                        <span className="text-[10px]">PWR</span>
                        <span className="text-sm font-bold text-red-500">{Math.floor(encounter.power)}</span>
                      </div>
                      <div className="flex justify-between px-2">
                        <span className="text-[10px]">DEF</span>
                        <span className="text-sm font-bold text-red-500">{Math.floor(encounter.defense)}</span>
                      </div>
                      <div className="flex justify-between px-2 border-t border-white/5 pt-1">
                        <span className="text-[8px] opacity-50">EST. BOUNTY</span>
                        <span className="text-[10px] font-bold text-emerald-400">{encounter.credits} CR</span>
                      </div>
                    </div>
                  </div>

                  {encounter.clashResult && (
                    <div className="p-3 bg-white/5 border border-white/10 text-[10px] italic opacity-80">
                      {encounter.clashResult}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4">
                    <button onClick={() => handleEncounterAction('attack')} className="pixel-button flex items-center justify-center gap-2 group">
                      <Crosshair size={18} className="group-hover:animate-spin" />
                      <span>EXTORT (ATTACK)</span>
                    </button>
                    <button onClick={() => handleEncounterAction('defend')} className="pixel-button flex items-center justify-center gap-2">
                      <Shield size={18} />
                      <span>DEFEND</span>
                    </button>
                    <button onClick={() => handleEncounterAction('avoid')} className="pixel-button flex items-center justify-center gap-2">
                      <Move size={18} />
                      <span>AVOID ({encounter.type === 'ruin' ? '10%' : '80%'} CHANCE)</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                  <h3 className="text-xl font-bold tracking-widest">ENCOUNTER RESULT</h3>
                  <p className="text-sm leading-relaxed">{encounter.result}</p>
                  <button onClick={() => setEncounter(null)} className="pixel-button w-full">CONTINUE</button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

