import { Dispatch, SetStateAction } from 'react';
import { GameState, DiscoveryState } from '../types';
import { SECTOR_DROP_CHANCE } from '../constants';
import { pickLootItem } from '../utils/loot';

interface MovementCallbacks {
  onDiscovery: (d: DiscoveryState) => void;
  onTriggerEncounter: (isRuin: boolean) => void;
  onWizardEncounter: () => void;
}

export function useMovement(
  setState: Dispatch<SetStateAction<GameState | null>>,
  callbacks: MovementCallbacks
) {
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
      let nextJumpDriveDisabled = prev.jumpDriveDisabled;
      if (sector.type === 'Nebula' && !prev.hasCloakingSpell && Math.random() < 0.2) {
        if (!prev.jumpDriveDisabled) {
          nextJumpDriveDisabled = true;
          nextLog = [`RADIATION HAZARD: Jump drive disabled!`, ...nextLog].slice(0, 10);
          setTimeout(() => callbacks.onDiscovery({
            title: "RADIATION HAZARD",
            message: "Intense cosmic radiation has fried your jump drive navigation systems! Jumping is disabled until repaired at the Upgrade Center (64 CR).",
            isHazard: true
          }), 0);
        }
      }

      // Check for encounter chance on move - NO encounters in Trade Hubs or Asteroid Belts
      let encounterChance = 0.05;
      if (sector.type === 'Trade Hub' || sector.type === 'Asteroid Belt') encounterChance = 0;
      else if (sector.type === 'The Void') encounterChance = 0.01;

      if (encounterChance > 0 && Math.random() < encounterChance) {
        setTimeout(() => callbacks.onTriggerEncounter(sector.type === 'Ruin Sector'), 0);
      }

      // Wizard Encounter (Nebula only)
      if (sector.type === 'Nebula') {
        let wizardFound = false;
        if (!prev.hasMetWizard && prev.wizardCoords && newX === prev.wizardCoords.x && newY === prev.wizardCoords.y) {
          wizardFound = true;
        } else if (prev.hasMetWizard && (!prev.hasCloakingSpell || prev.cloakCharges === 0) && Math.random() < 1/16) {
          wizardFound = true;
        }

        if (wizardFound) {
          setTimeout(() => callbacks.onWizardEncounter(), 0);
        }
      }

      // Mining Encounter (Asteroid Belt only)
      if (sector.type === 'Asteroid Belt' && Math.random() < 0.1) {
        const bonus = prev.hasMinerUpgrade ? 2 : 0;
        const yield_ = Math.floor(Math.random() * 3) + 1 + bonus;

        setTimeout(() => callbacks.onDiscovery({
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
          jumpDriveDisabled: nextJumpDriveDisabled
        };
      }

      // Random item discovery (Tiered Loot Pools per Sector)
      const dropChance = SECTOR_DROP_CHANCE[sector.type] ?? 0;

      if (dropChance > 0 && Math.random() < dropChance) {
        const foundItem = pickLootItem(sector.type, prev);

        if (foundItem) {
          setTimeout(() => callbacks.onDiscovery({
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
            jumpDriveDisabled: nextJumpDriveDisabled
          };
        }
      }

      return {
        ...prev,
        globalCoords: { x: newX, y: newY },
        lastDirection,
        moveCount: nextMoveCount,
        log: nextLog,
        jumpDriveDisabled: nextJumpDriveDisabled
      };
    });
  };

  return { moveGlobal };
}
