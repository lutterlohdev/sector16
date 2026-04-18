/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SectorType = 'Asteroid Belt' | 'Ship Graveyard' | 'Nebula' | 'Trade Hub' | 'The Void' | 'Ruin Sector';

export interface Item {
  id: number | string;
  name: string;
  value: number;
}

export interface GameState {
  shipName: string;
  credits: number;
  nocturnium: number;
  cargoCapacity: number;
  power: number;
  defense: number;
  inventory: Item[];
  globalCoords: { x: number; y: number }; // 0-63 global grid (4x4 sectors of 16x16)
  lastJumpTime: number;
  upgrades: {
    cargo: number;
    shields: number;
    weapons: number;
    storage: number;
  };

  moveCount: number;
  log: string[];
  storageLocker: Item[];
  storageCapacity: number;
  storageLockerCoords: { x: number; y: number };
  upgradeCenterCoords: { x: number; y: number };
  map: Sector[];
  hasMetWizard: boolean;
  hasCloakingSpell: boolean;
  cloakCharges: number;
  hasMinerUpgrade: boolean;
  hasJumpDrive: boolean;
  jumpDriveDisabled: boolean;
  wizardCoords: { x: number; y: number } | null;
  lastDirection: 'up' | 'down' | 'left' | 'right';
}

export interface Sector {
  id: number;
  type: SectorType;
  name: string;
  coords: { r: number; c: number };
}

export type VolleyOutcome = 'hit' | 'miss' | 'critical';

export interface VolleyRecord {
  volley: number;
  outcome: VolleyOutcome;
  hitChance: number;
  wasOvercharged: boolean;
}

export interface EncounterState {
  name: string;
  power: number;
  defense: number;
  credits: number;
  type: 'pirate' | 'ruin';
  isAmbush: boolean;
  status: 'waiting' | 'ambushed' | 'charging' | 'between-volleys' | 'finished';
  result?: string;
  exchangeResult?: string;
  // Volley system fields
  currentVolley: number;
  npcShields: number;
  playerHitChance: number;
  lastOutcome?: VolleyOutcome;
  volleyLog: VolleyRecord[];
  isPlayerAttacking: boolean;
  overcharged?: boolean;
}

export interface DiscoveryState {
  title: string;
  message: string;
  item?: Item;
  nocturniumYield?: number;
  isHazard?: boolean;
}

export interface LootTier {
  weight: number;
  pool: number[];
}

export interface SectorLootTable {
  tiers: LootTier[];
}