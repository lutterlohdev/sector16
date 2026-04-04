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
  Skull,
  Move,
  RefreshCcw,
  AlertTriangle,
  Crosshair,
  Archive,
  Wand2,
  Check,
  X
} from 'lucide-react';
import { GameState, Sector, SectorType, Item } from './types';
import { SECTOR_DISTRIBUTION, HUB_NAMES, SPACE_JUNK, NPC_NAMES_PREFIX, NPC_NAMES_SUFFIX } from './constants';

const STORAGE_KEY = 'sector16_save_v1';

const INITIAL_STATE: GameState = {
  shipName: '',
  credits: 50,
  nocturnium: 0,
  cargoCapacity: 8,
  power: 0,
  defense: 0,
  inventory: [],
  globalCoords: { x: 40, y: 24 },
  lastJumpTime: Date.now(),
  upgrades: {
    cargo: 0,
    shields: 0,
    weapons: 0,
    storage: 0,
  },
  damagedUpgrades: {
    cargo: false,
    shields: false,
    weapons: false,
    storage: false,
  },
  moveCount: 0,
  log: ["System Initialized. Welcome to Sector 16."],
  storageLocker: [],
  storageCapacity: 8,
  storageLockerCoords: { x: 0, y: 0 }, // Will be set on first load
  upgradeCenterCoords: { x: 0, y: 0 }, // Will be set on first load
  map: [],
  hasMetWizard: false,
  hasCloakingSpell: false,
  hasMinerUpgrade: false,
  wizardCoords: null,
  lastDirection: 'up',
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

// const MAP = generateMap(); // Removed global constant to use state.map

export default function App() {
  const [state, setState] = useState<GameState | null>(null);
  const [isJumping, setIsJumping] = useState(false);
  const [jumpProgress, setJumpProgress] = useState(0);
  const [showInventory, setShowInventory] = useState(false);
  const [showStorage, setShowStorage] = useState(false);
  const [showUpgradeCenter, setShowUpgradeCenter] = useState(false);
  const [wizardEncounter, setWizardEncounter] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [discovery, setDiscovery] = useState<{
    title: string;
    message: string;
    item?: Item;
    nocturniumYield?: number;
    isHazard?: boolean;
  } | null>(null);
  const [encounter, setEncounter] = useState<{
    name: string;
    power: number;
    defense: number;
    credits: number;
    type: 'pirate' | 'ruin';
    isAmbush: boolean;
    status: 'waiting' | 'ambushed' | 'counter-attack' | 'finished';
    result?: string;
    exchangeResult?: string;
    hasAttacked?: boolean;
    usedDuctTape?: boolean;
    tempDefense?: number;
  } | null>(null);

  // Keyboard listeners for sub-sector movement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!state || isJumping || encounter || showInventory || showResetConfirm || discovery) return;

      let dx = 0;
      let dy = 0;

      if (e.key === 'ArrowUp') dy = -1;
      if (e.key === 'ArrowDown') dy = 1;
      if (e.key === 'ArrowLeft') dx = -1;
      if (e.key === 'ArrowRight') dx = 1;

      if (dx !== 0 || dy !== 0) {
        if (showUpgradeCenter) return;
        moveGlobal(dx, dy);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state, isJumping, encounter, showInventory, discovery, showResetConfirm]);

  const moveGlobal = (dx: number, dy: number) => {
    setState(prev => {
      if (!prev) return prev;
      const currentGlobal = prev.globalCoords || { x: 40, y: 24 };
      const newX = Math.max(0, Math.min(63, currentGlobal.x + dx));
      const newY = Math.max(0, Math.min(63, currentGlobal.y + dy));

      if (newX === currentGlobal.x && newY === currentGlobal.y) return prev;

      let lastDirection = prev.lastDirection;
      if (dx > 0) lastDirection = 'right';
      else if (dx < 0) lastDirection = 'left';
      else if (dy > 0) lastDirection = 'down';
      else if (dy < 0) lastDirection = 'up';

      const nextMoveCount = prev.moveCount + 1;
      const sectorIndex = Math.floor(newY / 16) * 4 + Math.floor(newX / 16);
      const sector = prev.map[sectorIndex];
      
      // Radiation Hazard (Nebula only)
      let nextLog = [...prev.log];
      let nextDamagedUpgrades = { ...prev.damagedUpgrades };
      if (sector.type === 'Nebula' && !prev.hasCloakingSpell && Math.random() < 0.2) {
        if (!nextDamagedUpgrades.shields) {
          nextDamagedUpgrades.shields = true;
          nextLog = [`RADIATION HAZARD: SHIELDS systems damaged!`, ...nextLog].slice(0, 10);
          setTimeout(() => setDiscovery({
            title: "RADIATION HAZARD",
            message: "Intense cosmic radiation has compromised your shield emitters! Defense dice are limited to 1 until repaired at a Trade Hub.",
            isHazard: true
          }), 0);
        }
      }

      // Check for encounter chance on move - NO encounters in Trade Hubs or Asteroid Belts
      let encounterChance = (sector.type === 'Trade Hub' || sector.type === 'Asteroid Belt') ? 0 : 0.05;

      if (encounterChance > 0 && Math.random() < encounterChance) {
        setTimeout(() => triggerEncounter(sector.type === 'Ruin Sector'), 0);
      }

      // Wizard Encounter (Nebula only)
      if (sector.type === 'Nebula') {
        let wizardFound = false;
        if (!prev.hasMetWizard && prev.wizardCoords && newX === prev.wizardCoords.x && newY === prev.wizardCoords.y) {
          wizardFound = true;
        } else if (prev.hasMetWizard && !prev.hasCloakingSpell && Math.random() < 1/16) {
          wizardFound = true;
        }

        if (wizardFound) {
          setTimeout(() => setWizardEncounter(true), 0);
        }
      }

      // Mining Encounter (Asteroid Belt only)
      if (sector.type === 'Asteroid Belt' && Math.random() < 0.1) {
        const bonus = prev.hasMinerUpgrade ? 2 : 0;
        const yield_ = Math.floor(Math.random() * 3) + 1 + bonus;
        
        setTimeout(() => setDiscovery({
          title: "ASTEROID ENCOUNTER",
          message: `You navigated into a dense cluster and found ${yield_} units of Nocturnium Ore!`,
          nocturniumYield: yield_
        }), 0);
        return {
          ...prev,
          globalCoords: { x: newX, y: newY },
          lastDirection,
          moveCount: nextMoveCount,
          log: nextLog,
          damagedUpgrades: nextDamagedUpgrades
        };
      }

      // Random item discovery (Rotational Rarity)
      const itemIndex = nextMoveCount % SPACE_JUNK.length;
      const candidateItem = SPACE_JUNK[itemIndex];
      
      // Increased rarity: baseOdds = value / 2 (was / 4)
      // Higher value = higher baseOdds = harder to find
      const baseOdds = candidateItem.value / 2;
      
      // Sector modifier
      let sectorMultiplier = 1;
      if (sector.type === 'Ship Graveyard') sectorMultiplier = 4; // was 5
      if (sector.type === 'Ruin Sector') sectorMultiplier = 2; // was 2.5
      if (sector.type === 'Trade Hub' || sector.type === 'Asteroid Belt') sectorMultiplier = 0;

      const successThreshold = sectorMultiplier;
      
      const foundItem = (Math.random() * baseOdds < successThreshold) ? candidateItem : null;

      if (foundItem) {
        setTimeout(() => setDiscovery({
          title: "DISCOVERY",
          message: `You found ${foundItem.name} drifting in the sector!`,
          item: foundItem
        }), 0);
        return {
          ...prev,
          globalCoords: { x: newX, y: newY },
          lastDirection,
          moveCount: nextMoveCount,
          log: nextLog,
          damagedUpgrades: nextDamagedUpgrades
        };
      }

      return {
        ...prev,
        globalCoords: { x: newX, y: newY },
        lastDirection,
        moveCount: nextMoveCount,
        log: nextLog,
        damagedUpgrades: nextDamagedUpgrades
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
        let nextState = { 
          ...INITIAL_STATE, 
          ...parsed,
          upgrades: { ...INITIAL_STATE.upgrades, ...(parsed.upgrades || {}) },
          damagedUpgrades: { ...INITIAL_STATE.damagedUpgrades, ...(parsed.damagedUpgrades || {}) }
        };
        
        // Ensure map is present
        if (!nextState.map || nextState.map.length === 0) {
          nextState.map = generateMap();
        }

        // Generate storage locker if not set
        if (nextState.storageLockerCoords.x === 0 && nextState.storageLockerCoords.y === 0) {
          const hub = nextState.map.find(s => s.name === "Endless Summer Station");
          if (hub) {
            let rx, ry;
            do {
              rx = Math.floor(Math.random() * 16);
              ry = Math.floor(Math.random() * 16);
            } while (rx === 8 && ry === 8);
            nextState.storageLockerCoords = {
              x: hub.coords.c * 16 + rx,
              y: hub.coords.r * 16 + ry
            };
          }
        }

        // Generate upgrade center if not set
        if (nextState.upgradeCenterCoords.x === 0 && nextState.upgradeCenterCoords.y === 0) {
          const hub = nextState.map.find(s => s.name === "The Nocturnal Hub");
          if (hub) {
            let rx, ry;
            do {
              rx = Math.floor(Math.random() * 16);
              ry = Math.floor(Math.random() * 16);
            } while (rx === 8 && ry === 8 || (hub.coords.c * 16 + rx === nextState.storageLockerCoords.x && hub.coords.r * 16 + ry === nextState.storageLockerCoords.y));
            nextState.upgradeCenterCoords = {
              x: hub.coords.c * 16 + rx,
              y: hub.coords.r * 16 + ry
            };
          }
        }

        // Generate wizard if not set
        if (!nextState.wizardCoords && !nextState.hasMetWizard) {
          const nebulas = nextState.map.filter(s => s.type === 'Nebula');
          if (nebulas.length > 0) {
            const nebula = nebulas[Math.floor(Math.random() * nebulas.length)];
            nextState.wizardCoords = {
              x: nebula.coords.c * 16 + Math.floor(Math.random() * 16),
              y: nebula.coords.r * 16 + Math.floor(Math.random() * 16)
            };
          }
        }

        setState(nextState);
      } catch (e) {
        const nextState = { ...INITIAL_STATE, map: generateMap() };
        setState(nextState);
      }
    } else {
      let nextState = { ...INITIAL_STATE, map: generateMap() };
      const hub = nextState.map.find(s => s.name === "Endless Summer Station");
      if (hub) {
        let rx, ry;
        do {
          rx = Math.floor(Math.random() * 16);
          ry = Math.floor(Math.random() * 16);
        } while (rx === 8 && ry === 8);
        nextState.storageLockerCoords = {
          x: hub.coords.c * 16 + rx,
          y: hub.coords.r * 16 + ry
        };
      }

      const hub2 = nextState.map.find(s => s.name === "The Nocturnal Hub");
      if (hub2) {
        let rx, ry;
        do {
          rx = Math.floor(Math.random() * 16);
          ry = Math.floor(Math.random() * 16);
        } while (rx === 8 && ry === 8 || (hub2.coords.c * 16 + rx === nextState.storageLockerCoords.x && hub2.coords.r * 16 + ry === nextState.storageLockerCoords.y));
        nextState.upgradeCenterCoords = {
          x: hub2.coords.c * 16 + rx,
          y: hub2.coords.r * 16 + ry
        };
      }

      // Generate wizard if not set
      const nebulas = nextState.map.filter(s => s.type === 'Nebula');
      if (nebulas.length > 0) {
        const nebula = nebulas[Math.floor(Math.random() * nebulas.length)];
        nextState.wizardCoords = {
          x: nebula.coords.c * 16 + Math.floor(Math.random() * 16),
          y: nebula.coords.r * 16 + Math.floor(Math.random() * 16)
        };
      }
      setState(nextState);
    }
  }, []);

  // Save game
  useEffect(() => {
    if (state) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const addLog = (msg: string) => {
    setState(prev => {
      if (!prev) return prev;
      return { ...prev, log: [msg, ...prev.log].slice(0, 10) };
    });
  };

  const resetGame = () => {
    localStorage.removeItem(STORAGE_KEY);
    const nextState = { ...INITIAL_STATE, map: generateMap(), log: ["System Reset. Welcome to Sector 16."] };
    const hub = nextState.map.find(s => s.name === "Endless Summer Station");
    if (hub) {
      let rx, ry;
      do {
        rx = Math.floor(Math.random() * 16);
        ry = Math.floor(Math.random() * 16);
      } while (rx === 8 && ry === 8);
      nextState.storageLockerCoords = {
        x: hub.coords.c * 16 + rx,
        y: hub.coords.r * 16 + ry
      };
    }

    const hub2 = nextState.map.find(s => s.name === "The Nocturnal Hub");
    if (hub2) {
      let rx, ry;
      do {
        rx = Math.floor(Math.random() * 16);
        ry = Math.floor(Math.random() * 16);
      } while (rx === 8 && ry === 8 || (hub2.coords.c * 16 + rx === nextState.storageLockerCoords.x && hub2.coords.r * 16 + ry === nextState.storageLockerCoords.y));
      nextState.upgradeCenterCoords = {
        x: hub2.coords.c * 16 + rx,
        y: hub2.coords.r * 16 + ry
      };
    }

    const nebulas = nextState.map.filter(s => s.type === 'Nebula');
    if (nebulas.length > 0) {
      const nebula = nebulas[Math.floor(Math.random() * nebulas.length)];
      nextState.wizardCoords = {
        x: nebula.coords.c * 16 + Math.floor(Math.random() * 16),
        y: nebula.coords.r * 16 + Math.floor(Math.random() * 16)
      };
    }

    setState(nextState);
    setShowResetConfirm(false);
  };

  const currentSector = useMemo(() => {
    if (!state || !state.map || state.map.length === 0) return null;
    const sectorIndex = Math.floor(state.globalCoords.y / 16) * 4 + Math.floor(state.globalCoords.x / 16);
    return state.map[sectorIndex];
  }, [state?.globalCoords, state?.map]);

  const isAtStorageLocker = useMemo(() => {
    if (!state) return false;
    return state.globalCoords.x === state.storageLockerCoords.x && 
           state.globalCoords.y === state.storageLockerCoords.y;
  }, [state?.globalCoords, state?.storageLockerCoords]);

  const isAtUpgradeCenter = useMemo(() => {
    if (!state) return false;
    return state.globalCoords.x === state.upgradeCenterCoords.x && 
           state.globalCoords.y === state.upgradeCenterCoords.y;
  }, [state?.globalCoords, state?.upgradeCenterCoords]);

  const totalPower = useMemo(() => {
    if (!state) return 0;
    return state.power;
  }, [state]);

  const totalDefense = useMemo(() => {
    if (!state) return 0;
    return state.defense + (encounter?.tempDefense || 0);
  }, [state, encounter?.tempDefense]);



  const jumpTo = (index: number) => {
    if (!state || isJumping) return;
    const currentSectorIndex = Math.floor(state.globalCoords.y / 16) * 4 + Math.floor(state.globalCoords.x / 16);
    if (index === currentSectorIndex) return;

    const from = state.map[currentSectorIndex].coords;
    const to = state.map[index].coords;
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
    const newSector = state.map[index];
    
    let damagedTarget: 'cargo' | 'shields' | 'weapons' | null = null;
    if (newSector.type === 'Nebula' && Math.random() < 0.2) {
      const upgrades = ['cargo', 'shields', 'weapons'] as const;
      const target = upgrades[Math.floor(Math.random() * upgrades.length)];
      if (state.upgrades[target] > 0 && !state.damagedUpgrades[target]) {
        damagedTarget = target;
      }
    }

    const sectorRow = Math.floor(index / 4);
    const sectorCol = index % 4;
    const newCoords = { x: sectorCol * 16 + 8, y: sectorRow * 16 + 8 };

    setState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        globalCoords: newCoords,
        lastDirection: 'up',
        damagedUpgrades: damagedTarget ? { ...prev.damagedUpgrades, [damagedTarget]: true } : prev.damagedUpgrades
      };
    });

    if (damagedTarget) {
      const systemName = damagedTarget.charAt(0).toUpperCase() + damagedTarget.slice(1);
      const penalty = damagedTarget === 'shields' ? 'Defense dice limited to 1' : (damagedTarget === 'weapons' ? 'Attack dice limited to 1' : 'Cargo access restricted');
      addLog(`WARNING: Nebula radiation compromised ${damagedTarget} systems! ${penalty}.`);
    }

    // Random Encounter
    const encounterChance = (newSector.type === 'Trade Hub') ? 0 : 0.05;
    if (encounterChance > 0 && Math.random() < encounterChance) {
      triggerEncounter(newSector.type === 'Ruin Sector');
    }
  };

  const triggerEncounter = (isRuin: boolean) => {
    if (state && state.defense <= 0) return; // Cannot be attacked if defense is 0

    const name = `${NPC_NAMES_PREFIX[Math.floor(Math.random() * NPC_NAMES_PREFIX.length)]} ${NPC_NAMES_SUFFIX[Math.floor(Math.random() * NPC_NAMES_SUFFIX.length)]}`;
    
    // NPC Power/Defense scaling
    const pPower = state?.power || 1;
    const pDefense = state?.defense || 1;
    
    let npcPower: number;
    let npcDefense: number;

    if (isRuin) {
      // Ruin Sector: High risk, high reward (+5 / -1)
      const maxP = pPower + 5;
      const minP = pPower <= 5 ? Math.max(1, pPower - 1) : 1;
      npcPower = Math.floor(Math.random() * (maxP - minP + 1)) + minP;

      const maxD = pDefense + 5;
      const minD = pDefense <= 5 ? Math.max(1, pDefense - 1) : 1;
      npcDefense = Math.floor(Math.random() * (maxD - minD + 1)) + minD;
    } else {
      // Normal Sector: Standard variance (+3 / -3)
      const maxP = pPower + 3;
      const minP = pPower <= 5 ? Math.max(1, pPower - 3) : 1;
      npcPower = Math.floor(Math.random() * (maxP - minP + 1)) + minP;

      const maxD = pDefense + 3;
      const minD = pDefense <= 5 ? Math.max(1, pDefense - 3) : 1;
      npcDefense = Math.floor(Math.random() * (maxD - minD + 1)) + minD;
    }

    // Apply Archetypes (20% Glass Cannon, 20% Tank, 60% Standard)
    const archetypeRoll = Math.random();
    let archetype = "Standard";
    if (archetypeRoll < 0.2) {
      archetype = "Glass Cannon";
      npcPower = Math.ceil(npcPower * 1.5);
      npcDefense = Math.max(1, Math.floor(npcDefense * 0.5));
    } else if (archetypeRoll < 0.4) {
      archetype = "Tank";
      npcPower = Math.max(1, Math.floor(npcPower * 0.5));
      npcDefense = Math.ceil(npcDefense * 1.5);
    }

    // NPC Credits: Decoupled from player, based on NPC stats
    const baseCredits = (npcPower + npcDefense) * 8;
    const npcCredits = Math.floor(baseCredits * (0.7 + Math.random() * 0.6)); // 70% to 130%

    const isAmbush = Math.random() < 0.4;

    setEncounter({
      name: name,
      power: npcPower,
      defense: npcDefense,
      credits: npcCredits,
      type: isRuin ? 'ruin' : 'pirate',
      isAmbush,
      status: isAmbush ? 'ambushed' : 'waiting',
      hasAttacked: false
    });
  };

  const handleAction = (action: 'trade' | 'repair') => {
    if (!state || !currentSector) return;
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
        if (type === 'shields') nextDefense += 1; // Simple +1
        if (type === 'weapons') nextPower += 1; // Simple +1
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

  const useDuctTape = () => {
    if (!state || !encounter || encounter.usedDuctTape) return;
    const tapeIndex = state.inventory.findIndex(item => item.name === 'Duct Tape');
    if (tapeIndex === -1) return;

    const newInventory = [...state.inventory];
    newInventory.splice(tapeIndex, 1);

    setState(prev => prev ? ({
      ...prev,
      inventory: newInventory
    }) : null);

    setEncounter(prev => prev ? ({
      ...prev,
      tempDefense: (prev.tempDefense || 0) + 1,
      usedDuctTape: true,
      exchangeResult: "Used Duct Tape! Shields reinforced (+1 Defense for this battle)."
    }) : null);

    addLog("Used Duct Tape to patch the shields.");
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

  const handleEncounterAction = (action: 'attack' | 'defend' | 'avoid' | 'fly') => {
    if (!state || !encounter) return;

    const rollDice = (count: number) => {
      return Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1).sort((a, b) => b - a);
    };

    const triggerDeath = (prev: GameState) => {
      const tradeHub = prev.map.find(s => s.type === 'Trade Hub');
      const hubCoords = tradeHub ? { x: tradeHub.coords.c * 16 + 8, y: tradeHub.coords.r * 16 + 8 } : { x: 40, y: 24 };
      
      const nextCredits = Math.floor(prev.credits * 0.1);
      const newCapacity = 8;
      
      // If inventory + nocturnium > newCapacity, remove random items until it fits
      let nextInventory = [...prev.inventory];
      let nextNocturnium = prev.nocturnium;
      
      while (nextInventory.length + nextNocturnium > newCapacity) {
        if (nextInventory.length > 0) {
          // Remove a random item
          const index = Math.floor(Math.random() * nextInventory.length);
          nextInventory.splice(index, 1);
        } else if (nextNocturnium > 0) {
          // Remove nocturnium
          nextNocturnium--;
        } else {
          break;
        }
      }

      return {
        ...prev,
        power: 0,
        defense: 0,
        credits: nextCredits,
        inventory: nextInventory,
        nocturnium: nextNocturnium,
        globalCoords: hubCoords,
        upgrades: { ...prev.upgrades, cargo: 0, shields: 0, weapons: 0 },
        damagedUpgrades: { cargo: false, shields: false, weapons: false, storage: false },
        cargoCapacity: newCapacity
      };
    };

    const handleDeathSideEffects = () => {
      const tradeHub = state.map.find(s => s.type === 'Trade Hub');
      const msg = `LOOTED! Your ship was disabled. You were towed to ${tradeHub?.name || 'Trade Hub'}. Stats reset. 90% credits lost.`;
      addLog(msg);
      setEncounter(e => e ? { ...e, result: msg, status: 'finished' } : null);
    };

    if (action === 'fly') {
      addLog("You successfully flew away.");
      setEncounter(null);
      return;
    }

    if (action === 'avoid') {
      const chance = state.hasCloakingSpell ? 1.0 : (!encounter.isAmbush ? 1.0 : (encounter.type === 'ruin' ? 0.1 : 0.8));
      if (Math.random() < chance) {
        addLog(state.hasCloakingSpell ? "Cloaking Spell active: Successfully avoided the encounter." : "Successfully avoided the encounter.");
        setEncounter(null);
      } else {
        if (encounter.isAmbush) {
          addLog("Avoid failed! You took damage while fleeing.");
          if (state.defense - 1 <= 0) {
            setState(prev => prev ? triggerDeath(prev) : null);
            handleDeathSideEffects();
          } else {
            setState(prev => {
              if (!prev) return prev;
              const nextDefense = prev.defense - 1;
              return { 
                ...prev, 
                defense: nextDefense,
                upgrades: { ...prev.upgrades, shields: nextDefense }
              };
            });
            setEncounter(prev => prev ? { ...prev, result: "Avoid failed. You took 1 damage and the other ship disengaged.", status: 'finished' } : null);
          }
        } else {
          addLog("Failed to avoid! Forced to defend.");
          handleEncounterAction('defend');
        }
      }
      return;
    }

    if (action === 'attack') {
      // Flee Check: After the initial attack, 10% chance to flee
      if (encounter.hasAttacked && Math.random() < 0.1) {
        const msg = `${encounter.name} warped out! The encounter ended instantly.`;
        addLog(msg);
        setEncounter(prev => prev ? { ...prev, result: msg, status: 'finished' } : null);
        return;
      }

      // Exchange: Power dice vs Defense dice
      let playerDiceCount = Math.min(Math.floor(totalPower), 3);
      if (state.damagedUpgrades.weapons && playerDiceCount > 1) {
        playerDiceCount = 1;
      }
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
      setState(prev => {
        if (!prev) return prev;
        const nextPower = Math.max(0, prev.power + pWins - nWins);
        return {
          ...prev,
          power: nextPower,
          upgrades: { ...prev.upgrades, weapons: nextPower }
        };
      });

      // Update NPC stats
      const nextDefense = Math.max(0, encounter.defense - pWins);
      let exchangeMsg = `Exchange: You rolled [${pDice.join(',')}] vs Other [${nDice.join(',')}]. You won ${pWins} ${pWins === 1 ? 'exchange' : 'exchanges'}.`;
      
      if (pWins === 0) {
        exchangeMsg = `The other ship successfully defended itself and flew away. You lost 1 Power in the exchange.`;
      }

      if (nextDefense <= 0) {
        // Win and loot ship
        const loot = encounter.credits;
        let foundItem: Item | null = null;
        if (Math.random() < (encounter.type === 'ruin' ? 0.8 : 0.3)) {
           const candidate = SPACE_JUNK[Math.floor(Math.random() * SPACE_JUNK.length)];
           const baseOdds = candidate.value / 4;
           const successThreshold = 2; // Combat bonus
           if (Math.random() * baseOdds < successThreshold) {
              foundItem = candidate;
           }
        }

        // Random Nocturnium loot (up to 8)
        const noctLoot = Math.floor(Math.random() * 9); // 0 to 8

        setState(s => {
          if (!s) return s;
          
          let nextInventory = [...s.inventory];
          let nextNocturnium = s.nocturnium;
          let itemsLooted = 0;
          let noctLooted = 0;

          // Try to add item
          if (foundItem && (nextInventory.length + nextNocturnium) < s.cargoCapacity) {
            nextInventory.push(foundItem);
            itemsLooted = 1;
          }

          // Try to add nocturnium
          for (let i = 0; i < noctLoot; i++) {
            if ((nextInventory.length + nextNocturnium) < s.cargoCapacity) {
              nextNocturnium++;
              noctLooted++;
            } else {
              break;
            }
          }

          return {
            ...s,
            credits: s.credits + loot,
            inventory: nextInventory,
            nocturnium: nextNocturnium
          };
        });

        const msg = `VICTORY! You destroyed ${encounter.name} and looted ${loot} credits.${foundItem ? ` Salvaged: ${foundItem.name}` : ''}${noctLoot > 0 ? ` Found ${noctLoot} Nocturnium.` : ''}`;
        addLog(msg);
        setEncounter(prev => prev ? { ...prev, defense: 0, result: msg, exchangeResult: exchangeMsg, status: 'finished' } : null);
      } else if (pWins === 0) {
        const msg = `FAILED ATTACK! The other ship successfully defended itself and flew away. You lost 1 Power in the exchange.`;
        addLog(msg);
        setEncounter(prev => prev ? { ...prev, result: msg, exchangeResult: exchangeMsg, status: 'finished' } : null);
      } else {
        setEncounter(prev => prev ? { ...prev, defense: nextDefense, hasAttacked: true, exchangeResult: exchangeMsg } : null);
      }

      addLog(`Attack: You rolled [${pDice.join(',')}] vs Other [${nDice.join(',')}]. You won ${pWins} ${pWins === 1 ? 'exchange' : 'exchanges'}.`);
      return;
    }

    if (action === 'defend') {
      // Exchange: NPC Power dice vs Player Defense dice
      const npcDiceCount = Math.min(Math.floor(encounter.power), 3);
      let playerDiceCount = Math.min(Math.floor(totalDefense + (encounter.tempDefense || 0)), 2);
      if (state.damagedUpgrades.shields && playerDiceCount > 1) {
        playerDiceCount = 1;
      }
      
      const nDice = rollDice(npcDiceCount);
      const pDice = rollDice(playerDiceCount);
      
      const comparisons = Math.min(npcDiceCount, playerDiceCount);
      let nWinsLocal = 0;
      let pWinsLocal = 0;
      
      for (let i = 0; i < comparisons; i++) {
        if (nDice[i] > pDice[i]) nWinsLocal++;
        else pWinsLocal++; // Ties go to defender
      }

      // Logic for results
      if (pWinsLocal > nWinsLocal) {
        // Player Wins
        addLog("Defend successful! You have the advantage.");
        setEncounter(prev => prev ? { ...prev, status: 'counter-attack', exchangeResult: `Defense: You won the exchange! [${pDice.join(',')}] vs [${nDice.join(',')}]` } : null);
      } else if (pWinsLocal === nWinsLocal) {
        // Split Decision
        if (Math.random() < 0.5) {
          addLog("Split decision! The other ship flies away.");
          setEncounter(prev => prev ? { ...prev, result: "Split decision. The other ship disengaged.", status: 'finished' } : null);
        } else {
          addLog("Split decision! The other ship attacks again!");
          setEncounter(prev => prev ? { ...prev, exchangeResult: "Split decision. The other ship is coming around for another pass!" } : null);
        }
      } else {
        // Player Loses
        addLog("Defend failed! You took damage.");
        
        // Handle temp defense first
        let remainingLoss = nWinsLocal;
        let newTempDefense = encounter.tempDefense || 0;
        if (newTempDefense > 0) {
          const reduction = Math.min(newTempDefense, remainingLoss);
          newTempDefense -= reduction;
          remainingLoss -= reduction;
        }

        if (state.defense - remainingLoss <= 0) {
          setState(prev => prev ? triggerDeath(prev) : null);
          handleDeathSideEffects();
        } else {
          setState(prev => {
            if (!prev) return prev;
            const nextDefense = prev.defense - remainingLoss;
            return { 
              ...prev, 
              defense: nextDefense,
              upgrades: { ...prev.upgrades, shields: nextDefense }
            };
          });

          if (Math.random() < 0.6) {
            addLog("The other ship attacks again!");
            setEncounter(prev => prev ? { ...prev, exchangeResult: `Defend failed. You lost ${nWinsLocal} Defense. The other ship attacks again!`, tempDefense: newTempDefense } : null);
          } else {
            addLog("The other ship disengages.");
            setEncounter(prev => prev ? { ...prev, result: `Defend failed. You lost ${nWinsLocal} Defense. The other ship disengaged.`, status: 'finished' } : null);
          }
        }
      }
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
        <div className="flex flex-col justify-center">
          <span className="text-lg font-bold tracking-tighter">{state.shipName}</span>
        </div>
        <div className="flex gap-6">
          <button 
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-2 text-red-500/50 hover:text-red-500 transition-colors text-[10px] tracking-widest"
            title="RESET GAME"
          >
            <RefreshCcw size={12} />
            <span>RESET</span>
          </button>
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
              key="jump-overlay"
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

        {/* Reset Confirmation Overlay */}
        <AnimatePresence>
          {showResetConfirm && (
            <motion.div 
              key="reset-confirm-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
            >
              <div className="pixel-border bg-black p-6 max-w-xs w-full text-center">
                <AlertTriangle className="mx-auto mb-4 text-red-500" size={32} />
                <h2 className="text-sm font-bold tracking-widest mb-2">WIPE ALL DATA?</h2>
                <p className="text-[10px] opacity-70 mb-6 leading-relaxed">
                  THIS WILL PERMANENTLY DELETE YOUR SAVE FILE AND RESET ALL PROGRESS.
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 pixel-button text-[10px] py-2"
                  >
                    CANCEL
                  </button>
                  <button 
                    onClick={resetGame}
                    className="flex-1 pixel-button text-[10px] py-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                  >
                    RESET
                  </button>
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
                  {currentSector?.name === "Endless Summer Station" && (
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
                            onClick={() => setShowStorage(true)}
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

                  {currentSector?.name === "The Nocturnal Hub" && (
                    <div className="space-y-4 mb-8">
                      {isAtUpgradeCenter ? (
                        <div className="p-4 border border-green-500/30 bg-green-500/5 space-y-4">
                          <div className="flex justify-between items-center border-b border-green-500/30 pb-2">
                            <p className="text-sm text-green-400 font-bold uppercase tracking-widest">Upgrade Center Access</p>
                            <TrendingUp size={16} className="text-green-400" />
                          </div>
                          <p className="text-[10px] opacity-70 italic">
                            A specialized facility for permanent ship enhancements.
                          </p>
                          <button 
                            onClick={() => setShowUpgradeCenter(true)}
                            className="w-full pixel-button py-2 text-xs bg-green-500/20 border-green-500/50 hover:bg-green-500/40"
                          >
                            ACCESS UPGRADE CENTER
                          </button>
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

                  <div className="space-y-4">
                  {state.globalCoords.x % 16 === 8 && state.globalCoords.y % 16 === 8 ? (
                    <div className="space-y-4">
                      {(() => {
                        const basePrice = 16;
                        const weaponsCost = Math.floor(basePrice * Math.pow(2, state.upgrades.weapons));
                        const shieldsCost = Math.floor(basePrice * Math.pow(2, state.upgrades.shields));
                        const isWeaponsOffline = state.power <= 0;
                        const isShieldsDown = state.defense <= 0;
                        const needsWarning = isWeaponsOffline || isShieldsDown || state.damagedUpgrades.weapons || state.damagedUpgrades.shields;
                        
                        if (needsWarning) {
                          const canAffordAny = (isWeaponsOffline && state.credits >= weaponsCost) || (isShieldsDown && state.credits >= shieldsCost) || state.damagedUpgrades.weapons || state.damagedUpgrades.shields;
                          return (
                            <div className="p-3 border border-yellow-500/30 bg-yellow-500/5 mb-4">
                              <p className="text-xs text-yellow-400 font-bold mb-1 uppercase tracking-tighter">Warning: Systems Compromised</p>
                              <div className="text-[10px] opacity-70 italic space-y-1">
                                {isWeaponsOffline && <p>Weapons systems offline.</p>}
                                {state.damagedUpgrades.weapons && !isWeaponsOffline && <p className="text-yellow-400">Weapons compromised: Attack dice limited to 1.</p>}
                                {isShieldsDown && <p>Shields down.</p>}
                                {state.damagedUpgrades.shields && !isShieldsDown && <p className="text-yellow-400">Shields compromised: Defense dice limited to 1.</p>}
                                <p className="mt-2 text-white not-italic">
                                  {canAffordAny 
                                    ? "Recommendation: Use your credits to upgrade your systems immediately."
                                    : "Recommendation: Travel to the Asteroid Belt to mine Nocturnium and sell it for upgrades."}
                                </p>
                              </div>
                            </div>
                          );
                        }
                        return (
                          <div className="p-3 border border-emerald-500/30 bg-emerald-500/5 mb-4">
                            <p className="text-xs text-emerald-400 font-bold mb-1 uppercase tracking-tighter">Docking Successful</p>
                            <p className="text-[10px] opacity-70 italic">Welcome to {currentSector.name}. All systems green.</p>
                          </div>
                        );
                      })()}

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

                      <div className="grid grid-cols-1 gap-2 mt-4">
                        <p className="text-xs border-b border-white pb-1">UPGRADES</p>
                        {(['cargo', 'shields', 'weapons', 'storage'] as const).map(type => {
                          const basePrice = 16;
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

              {currentSector?.type === 'Asteroid Belt' && (
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

              {currentSector?.type === 'The Void' && (
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

              {currentSector?.type === 'Nebula' && (
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

              {currentSector?.type === 'Ruin Sector' && (
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

              {currentSector?.type === 'Ship Graveyard' && (
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

          {/* Log */}
          <div className="h-40 border-t-2 border-white p-4 bg-black/80 overflow-y-auto text-[10px] space-y-1">
            {state.log.map((m, i) => (
              <div key={i} className={i === 0 ? 'text-white' : 'opacity-40'}>
                {`> ${m}`}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <div className="flex border-t-2 border-white bg-black">
        <button 
          onClick={() => setShowInventory(true)} 
          disabled={!!encounter}
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
            {state.hasCloakingSpell && (
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

      {/* Modals */}
      <AnimatePresence>
        {showInventory && (
          <motion.div 
            key="inventory-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black/90 backdrop-blur-sm"
          >
            <div className="w-full max-w-2xl pixel-border bg-black p-6 flex flex-col max-h-[80vh]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold tracking-widest">CARGO HOLD</h3>
                <button onClick={() => setShowInventory(false)} className="pixel-button py-1 px-3">CLOSE</button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-4">
                <div className="flex justify-between items-center border-b border-white pb-2">
                  <div className="flex flex-col">
                    <span>NOCTURNIUM ORE</span>
                    <span className="text-[10px] opacity-50">{state.nocturnium} UNITS</span>
                  </div>
                  <div className="flex gap-2">
                    {state.nocturnium > 0 && (
                      <>
                        <button 
                          onClick={() => setState(prev => prev ? ({ ...prev, nocturnium: prev.nocturnium - 1 }) : null)}
                          className="text-red-500 hover:bg-red-500 hover:text-white px-2 py-1 text-[8px] border border-red-500/30 uppercase tracking-tighter"
                        >
                          JETTISON 1
                        </button>
                        <button 
                          onClick={() => setState(prev => prev ? ({ ...prev, nocturnium: 0 }) : null)}
                          className="text-red-500 hover:bg-red-500 hover:text-white px-2 py-1 text-[8px] border border-red-500/30 uppercase tracking-tighter"
                        >
                          JETTISON ALL
                        </button>
                      </>
                    )}
                  </div>
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
                          className="text-red-500 hover:bg-red-500 hover:text-white p-1 flex items-center gap-1 text-[8px] border border-red-500/30 px-2 uppercase"
                        >
                          <Trash2 size={12} />
                          JETTISON
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

        {showStorage && (
          <motion.div 
            key="storage-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black/90 backdrop-blur-sm"
          >
            <div className="w-full max-w-2xl pixel-border bg-black p-6 flex flex-col max-h-[80vh]">
              <div className="flex justify-between items-center mb-6">
                <div className="flex flex-col">
                  <h3 className="text-xl font-bold tracking-widest uppercase">Storage Locker</h3>
                  <span className="text-[10px] opacity-50">SECURE FACILITY - {state.storageLocker.length} / {state.storageCapacity} SLOTS</span>
                </div>
                <button onClick={() => setShowStorage(false)} className="pixel-button py-1 px-3">CLOSE</button>
              </div>
              
              <div className="grid grid-cols-2 gap-6 flex-1 overflow-hidden">
                {/* Ship Cargo */}
                <div className="flex flex-col overflow-hidden">
                  <p className="text-[10px] opacity-50 uppercase mb-2">Ship Cargo ({state.inventory.length} / {state.cargoCapacity})</p>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {state.inventory.map((item, i) => (
                      <div key={i} className="flex justify-between items-center p-2 border border-white/10 text-[10px]">
                        <span className="truncate flex-1 mr-2">{item.name}</span>
                        <button 
                          onClick={() => {
                            if (state.storageLocker.length < state.storageCapacity) {
                              setState(prev => {
                                if (!prev) return prev;
                                const nextInventory = prev.inventory.filter((_, idx) => idx !== i);
                                const nextStorage = [...prev.storageLocker, item];
                                return { ...prev, inventory: nextInventory, storageLocker: nextStorage };
                              });
                            }
                          }}
                          disabled={state.storageLocker.length >= state.storageCapacity}
                          className="pixel-button px-2 py-1 disabled:opacity-30"
                        >
                          STORE
                        </button>
                      </div>
                    ))}
                    {state.inventory.length === 0 && <p className="text-center py-4 opacity-30 italic text-[10px]">Cargo empty.</p>}
                  </div>
                </div>

                {/* Locker Contents */}
                <div className="flex flex-col overflow-hidden">
                  <p className="text-[10px] opacity-50 uppercase mb-2">Locker Contents ({state.storageLocker.length} / {state.storageCapacity})</p>
                  <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                    {state.storageLocker.map((item, i) => (
                      <div key={i} className="flex justify-between items-center p-2 border border-blue-500/20 text-[10px]">
                        <span className="truncate flex-1 mr-2">{item.name}</span>
                        <button 
                          onClick={() => {
                            if (state.inventory.length + state.nocturnium < state.cargoCapacity) {
                              setState(prev => {
                                if (!prev) return prev;
                                const nextStorage = prev.storageLocker.filter((_, idx) => idx !== i);
                                const nextInventory = [...prev.inventory, item];
                                return { ...prev, inventory: nextInventory, storageLocker: nextStorage };
                              });
                            }
                          }}
                          disabled={state.inventory.length + state.nocturnium >= state.cargoCapacity}
                          className="pixel-button px-2 py-1 disabled:opacity-30"
                        >
                          RETRIEVE
                        </button>
                      </div>
                    ))}
                    {state.storageLocker.length === 0 && <p className="text-center py-4 opacity-30 italic text-[10px]">Locker empty.</p>}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        {showUpgradeCenter && (
          <motion.div 
            key="upgrade-center-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-8 bg-black/90 backdrop-blur-sm"
          >
            <div className="w-full max-w-2xl pixel-border bg-black p-6 flex flex-col max-h-[80vh]">
              <div className="flex justify-between items-center mb-6">
                <div className="flex flex-col">
                  <h3 className="text-xl font-bold tracking-widest uppercase">Upgrade Center</h3>
                  <span className="text-[10px] opacity-50">ADVANCED ENGINEERING FACILITY</span>
                </div>
                <button onClick={() => setShowUpgradeCenter(false)} className="pixel-button py-1 px-3">CLOSE</button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                <div className="p-4 border border-green-500/30 bg-green-500/5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-bold text-green-400 uppercase tracking-widest">Nocturnium Miner Upgrade</h4>
                      <p className="text-xs opacity-70 mt-1">Permanently increases Nocturnium mining yield in Asteroid Belts by +2.</p>
                    </div>
                    {state.hasMinerUpgrade && (
                      <span className="px-2 py-1 bg-green-500 text-black text-[10px] font-bold uppercase">Installed</span>
                    )}
                  </div>

                  {!state.hasMinerUpgrade && (
                    <div className="space-y-4 pt-4 border-t border-green-500/20">
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">Required Components:</p>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { id: 17, name: "Functioning Relay" },
                          { id: 23, name: "Heavy Duty Cables" },
                          { id: 34, name: "Atmospheric Scrubber" }
                        ].map(req => {
                          const inInventory = state.inventory.some(item => item.id === req.id);
                          const inStorage = state.storageLocker.some(item => item.id === req.id);
                          const hasItem = inInventory || inStorage;

                          return (
                            <div key={req.id} className={`flex justify-between items-center p-2 border ${hasItem ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/30 bg-red-500/5'}`}>
                              <div className="flex items-center gap-2">
                                {hasItem ? <Check size={12} className="text-green-500" /> : <X size={12} className="text-red-500" />}
                                <span className={`text-xs ${hasItem ? 'text-white' : 'text-white/40'}`}>{req.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {inInventory && <span className="text-[8px] px-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 uppercase">In Cargo</span>}
                                {inStorage && <span className="text-[8px] px-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 uppercase">In Locker</span>}
                                {!hasItem && <span className="text-[8px] px-1 bg-red-500/20 text-red-500 border border-red-500/30 uppercase">Missing</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {(() => {
                        const reqIds = [17, 23, 34];
                        const hasAllInInventory = reqIds.every(id => state.inventory.some(item => item.id === id));
                        const hasAllTotal = reqIds.every(id => state.inventory.some(item => item.id === id) || state.storageLocker.some(item => item.id === id));
                        
                        if (hasAllInInventory) {
                          return (
                            <button 
                              onClick={() => {
                                setState(prev => {
                                  if (!prev) return prev;
                                  // Remove one of each required item from inventory
                                  let nextInventory = [...prev.inventory];
                                  reqIds.forEach(id => {
                                    const index = nextInventory.findIndex(item => item.id === id);
                                    if (index !== -1) {
                                      nextInventory.splice(index, 1);
                                    }
                                  });
                                  return { ...prev, inventory: nextInventory, hasMinerUpgrade: true };
                                });
                              }}
                              className="w-full pixel-button py-3 bg-green-500/20 border-green-500 hover:bg-green-500/40 text-green-400 font-bold uppercase tracking-widest"
                            >
                              INSTALL UPGRADE
                            </button>
                          );
                        } else if (hasAllTotal) {
                          return (
                            <div className="p-3 border border-yellow-500/30 bg-yellow-500/5 text-center">
                              <p className="text-[10px] text-yellow-500 uppercase font-bold">All components located, but some are in storage.</p>
                              <p className="text-[10px] opacity-70 mt-1">Retrieve all items to your cargo hold to install the upgrade.</p>
                            </div>
                          );
                        } else {
                          return (
                            <div className="p-3 border border-white/10 bg-white/5 text-center">
                              <p className="text-[10px] opacity-50 uppercase font-bold">Insufficient Components</p>
                              <p className="text-[10px] opacity-30 mt-1">Scavenge the galaxy for the required parts.</p>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  )}
                </div>

                <div className="p-4 border border-white/10 opacity-30">
                  <h4 className="text-sm font-bold uppercase tracking-widest">More Upgrades Coming Soon...</h4>
                  <p className="text-[10px] mt-1">Our engineers are working on advanced hull plating and engine boosters.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        {discovery && (
          <motion.div 
            key="discovery-modal"
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

              {discovery.nocturniumYield && (
                <div className="p-4 border border-white/20 bg-white/5 flex flex-col items-center gap-2">
                  <span className="text-lg font-bold">{discovery.nocturniumYield} NOCTURNIUM ORE</span>
                </div>
              )}

              {state && (state.inventory.length + state.nocturnium + (discovery.item ? 1 : (discovery.nocturniumYield || 0)) > state.cargoCapacity) && (
                <div className="p-3 border border-red-500/50 bg-red-500/10 space-y-1">
                  <p className="text-[10px] text-red-400 font-bold uppercase tracking-widest">Cargo Hold Full</p>
                  <p className="text-[9px] text-red-300/80 leading-tight">
                    You'll need to drop something from your cargo hold to collect this discovery.
                  </p>
                </div>
              )}
              
              {discovery.isHazard ? (
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => setDiscovery(null)} 
                    className="pixel-button w-full py-2 bg-red-500/20 border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                  >
                    ACKNOWLEDGE
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => {
                      if (!state) return;
                      const yield_ = discovery.nocturniumYield || 0;
                      const item = discovery.item;
                      const currentUsed = state.inventory.length + state.nocturnium;
                      const spaceNeeded = item ? 1 : yield_;

                      if (currentUsed + spaceNeeded > state.cargoCapacity) {
                        addLog("Cargo hold full. Must drop items to collect.");
                        setShowInventory(true);
                        return;
                      }

                      setState(prev => {
                        if (!prev) return prev;
                        return {
                          ...prev,
                          nocturnium: prev.nocturnium + yield_,
                          inventory: item ? [...prev.inventory, item] : prev.inventory
                        };
                      });
                      setDiscovery(null);
                      setShowInventory(false);
                    }} 
                    className="pixel-button w-full py-2 disabled:opacity-30"
                  >
                    {state && (state.inventory.length + state.nocturnium + (discovery.item ? 1 : (discovery.nocturniumYield || 0)) > state.cargoCapacity) ? 'MANAGE CARGO' : 'COLLECT'}
                  </button>
                  <button 
                    onClick={() => {
                      setDiscovery(null);
                      setShowInventory(false);
                    }} 
                    className="text-[10px] opacity-50 hover:opacity-100 uppercase tracking-widest"
                  >
                    Abandon
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {wizardEncounter && (
          <motion.div 
            key="wizard-modal"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[250] flex items-center justify-center p-8 bg-black/90 backdrop-blur-md"
          >
            <div className="w-full max-w-md pixel-border bg-black p-8 text-center space-y-6 border-purple-500/50">
              <div className="relative inline-block">
                <Wand2 className="mx-auto text-purple-400 animate-bounce" size={48} />
                <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full" />
              </div>
              
              <h3 className="text-xl font-bold tracking-widest text-purple-400 uppercase">The Mysterious Wizard</h3>
              
              {state && !state.hasMetWizard ? (
                <>
                  <p className="text-sm leading-relaxed italic opacity-80">
                    "Ah, a traveler in the mist. I seek a specific artifact to power my experiments... 
                    Bring me a <span className="text-emerald-400 font-bold">Hydroponics Grow Light</span>, 
                    and I shall grant you a spell of absolute invisibility."
                  </p>
                  <p className="text-[10px] opacity-50">
                    "I must vanish now. The nebulas are my home, but I am never in one place for long. 
                    Traverse the clouds to find me again when you have what I require."
                  </p>
                  <button 
                    onClick={() => {
                      setState(prev => prev ? ({ ...prev, hasMetWizard: true, wizardCoords: null }) : null);
                      setWizardEncounter(false);
                      addLog("Met the Mysterious Wizard. He seeks a Hydroponics Grow Light.");
                    }} 
                    className="pixel-button w-full py-2 border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
                  >
                    "I WILL FIND IT."
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm leading-relaxed italic opacity-80">
                    "We meet again, traveler. Do you have the light I seek?"
                  </p>
                  
                  {state && state.inventory.some(i => i.id === 39) ? (
                    <div className="space-y-4">
                      <div className="p-3 border border-emerald-500/30 bg-emerald-500/5">
                        <p className="text-[10px] text-emerald-400 uppercase font-bold">Item Detected: Hydroponics Grow Light</p>
                      </div>
                      <button 
                        onClick={() => {
                          setState(prev => {
                            if (!prev) return prev;
                            const itemIdx = prev.inventory.findIndex(i => i.id === 39);
                            const nextInv = [...prev.inventory];
                            nextInv.splice(itemIdx, 1);
                            return {
                              ...prev,
                              inventory: nextInv,
                              hasCloakingSpell: true,
                              wizardCoords: null // Reset wizard location
                            };
                          });
                          setWizardEncounter(false);
                          addLog("Exchanged Grow Light for the Cloaking Spell!");
                        }} 
                        className="pixel-button w-full py-2 bg-purple-500/20 border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white"
                      >
                        EXCHANGE ITEM FOR SPELL
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-xs text-red-400">You do not have the Hydroponics Grow Light.</p>
                      <p className="text-[10px] opacity-50 italic">
                        "Gotta keep moving... find me again when you have the item."
                      </p>
                      <button 
                        onClick={() => setWizardEncounter(false)} 
                        className="pixel-button w-full py-2 opacity-50"
                      >
                        CONTINUE SEARCH
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}

        {encounter && (
          <motion.div 
            key="encounter-modal"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-black/95"
          >
            <div className="w-full max-w-md pixel-border bg-black p-8 text-center space-y-8">
              {encounter.status !== 'finished' ? (
                <>
                  <div className="space-y-2">
                    <h3 className="text-red-500 text-sm tracking-widest animate-pulse">
                      {encounter.isAmbush ? 'AMBUSH DETECTED' : 'SHIP DETECTED'}
                    </h3>
                    <h2 className="text-2xl font-bold uppercase">{encounter.name}</h2>
                    <p className="text-xs opacity-50">
                      {encounter.isAmbush ? "YOU'VE BEEN ATTACKED!" : (encounter.type === 'ruin' ? 'ANCIENT GUARDIAN' : 'PIRATE VESSEL')}
                    </p>
                  </div>

                <div className="grid grid-cols-2 gap-8 border-y border-white/10 py-6">
                  <div className="text-left space-y-2">
                    <div className="text-[10px] uppercase opacity-50 font-mono">Your Ship</div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[10px] uppercase font-mono opacity-50">Power</span>
                      <span className="text-xl font-mono">{Math.floor(totalPower)}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[10px] uppercase font-mono opacity-50">Shields</span>
                      <span className="text-xl font-mono">
                        {Math.floor(state.defense)}
                        {encounter.tempDefense ? (
                          <span className="text-sm opacity-50 ml-1">+{encounter.tempDefense}</span>
                        ) : null}
                      </span>
                    </div>
                  </div>
                  <div className="text-right space-y-2">
                    <div className="text-[10px] uppercase opacity-50 font-mono">Other Ship</div>
                    <div className="flex items-baseline gap-2 justify-end">
                      <span className="text-[10px] uppercase font-mono opacity-50">Power</span>
                      <span className="text-xl font-mono">{Math.floor(encounter.power)}</span>
                    </div>
                    <div className="flex items-baseline gap-2 justify-end">
                      <span className="text-[10px] uppercase font-mono opacity-50">Shields</span>
                      <span className="text-xl font-mono">{Math.floor(encounter.defense)}</span>
                    </div>
                  </div>
                </div>

                {(encounter.status === 'waiting' || encounter.status === 'ambushed' || encounter.status === 'counter-attack') && !encounter.usedDuctTape && state.inventory.some(i => i.name === 'Duct Tape') && (
                  <button
                    onClick={useDuctTape}
                    className="pixel-button w-full py-2 text-[10px] uppercase tracking-widest font-bold"
                  >
                    Apply Duct Tape (DEFENSE +1)
                  </button>
                )}

                  {encounter.exchangeResult && (
                    <div className="p-3 bg-white/5 border border-white/10 text-[10px] italic opacity-80">
                      {encounter.exchangeResult}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4">
                    {encounter.status === 'waiting' && (
                      <>
                        <button 
                          onClick={() => handleEncounterAction('attack')} 
                          disabled={totalPower < 1}
                          className="pixel-button flex items-center justify-center gap-2 group disabled:opacity-30"
                        >
                          <Crosshair size={18} className={totalPower >= 1 ? "group-hover:animate-spin" : ""} />
                          <span>ATTACK</span>
                        </button>
                        {totalPower < 1 && (
                          <p className="text-[10px] text-red-500 animate-pulse">WEAPONS OFFLINE: ACQUIRE UPGRADES TO ATTACK</p>
                        )}
                        <button onClick={() => handleEncounterAction('avoid')} className="pixel-button flex items-center justify-center gap-2">
                          <Move size={18} />
                          <span>AVOID ({state.hasCloakingSpell ? '100%' : (!encounter.isAmbush ? '100%' : (encounter.type === 'ruin' ? '10%' : '80%'))} CHANCE)</span>
                        </button>
                      </>
                    )}

                    {encounter.status === 'ambushed' && (
                      <>
                        <button onClick={() => handleEncounterAction('defend')} className="pixel-button flex items-center justify-center gap-2">
                          <Shield size={18} />
                          <span>DEFEND</span>
                        </button>
                        <button onClick={() => handleEncounterAction('avoid')} className="pixel-button flex items-center justify-center gap-2">
                          <Move size={18} />
                          <span>AVOID ({state.hasCloakingSpell ? '100%' : (!encounter.isAmbush ? '100%' : (encounter.type === 'ruin' ? '10%' : '80%'))} CHANCE)</span>
                        </button>
                      </>
                    )}

                    {encounter.status === 'counter-attack' && (
                      <>
                        <button 
                          onClick={() => handleEncounterAction('attack')} 
                          disabled={totalPower < 1}
                          className="pixel-button flex items-center justify-center gap-2 group disabled:opacity-30"
                        >
                          <Crosshair size={18} className={totalPower >= 1 ? "group-hover:animate-spin" : ""} />
                          <span>ATTACK BACK</span>
                        </button>
                        <button onClick={() => handleEncounterAction('fly')} className="pixel-button flex items-center justify-center gap-2">
                          <Move size={18} />
                          <span>FLY AWAY (GUARANTEED)</span>
                        </button>
                      </>
                    )}
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
