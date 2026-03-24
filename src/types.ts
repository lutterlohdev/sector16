/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SectorType = 'Asteroid Belt' | 'Ship Graveyard' | 'Nebula' | 'Trade Hub' | 'The Void' | 'Ruin Sector';

export interface Item {
  id: number;
  name: string;
  value: number;
  isSpecial?: boolean;
  cargoSize?: number;
  modifier?: {
    type: 'attack' | 'defense';
    value: number;
  };
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
  };
  damagedUpgrades: {
    cargo: boolean;
    shields: boolean;
    weapons: boolean;
  };
  moveCount: number;
}

export interface Sector {
  id: number;
  type: SectorType;
  name: string;
  coords: { r: number; c: number };
}