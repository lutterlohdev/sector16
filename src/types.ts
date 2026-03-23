/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SectorType = 'Asteroid Belt' | 'Ship Graveyard' | 'Nebula' | 'Trade Hub' | 'The Void' | 'Ruin Sector';

export interface Item {
  id: number;
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
  luck: number;
  xp: number;
  inventory: Item[];
  globalCoords: { x: number; y: number }; // 0-63 global grid (4x4 sectors of 16x16)
  lastJumpTime: number;
  miningTimer: number; // Jumps until next yield
  minersCount: number; // Number of deployed miners
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
