import { GameState, Sector, SectorType } from '../types';
import { SECTOR_DISTRIBUTION, HUB_NAMES } from '../constants';

export const STORAGE_KEY = 'sector16_save_v1';

export const INITIAL_STATE: GameState = {
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
    weapons: false,
    storage: false,
  },
  moveCount: 0,
  log: ["System Initialized. Welcome to Sector 16."],
  storageLocker: [],
  storageCapacity: 8,
  storageLockerCoords: { x: 0, y: 0 },
  upgradeCenterCoords: { x: 0, y: 0 },
  map: [],
  hasMetWizard: false,
  hasCloakingSpell: false,
  hasMinerUpgrade: false,
  jumpDriveDisabled: false,
  wizardCoords: null,
  lastDirection: 'up',
};

export const generateMap = (): Sector[] => {
  const fixedSectors: Record<number, SectorType> = {
    0: 'Ruin Sector',   // 0,0
    15: 'Ruin Sector',  // 3,3
    6: 'Trade Hub',     // 1,2
    9: 'Trade Hub'      // 2,1
  };

  const pool = [...SECTOR_DISTRIBUTION];
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

/** Initialize world coordinates (storage locker, upgrade center, wizard) on a state */
export const initializeWorldCoords = (state: GameState): GameState => {
  const nextState = { ...state };

  // Generate storage locker if not set
  if (nextState.storageLockerCoords.x === 0 && nextState.storageLockerCoords.y === 0) {
    const hub = nextState.map.find(s => s.name === "Endless Summer Station");
    if (hub) {
      let rx: number, ry: number;
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
      let rx: number, ry: number;
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

  return nextState;
};
