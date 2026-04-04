import { Dispatch, SetStateAction } from 'react';
import { GameState, DiscoveryState } from '../types';
import { SPACE_JUNK } from '../constants';

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
      let nextDamagedUpgrades = { ...prev.damagedUpgrades };
      if (sector.type === 'Nebula' && !prev.hasCloakingSpell && Math.random() < 0.2) {
        if (!nextDamagedUpgrades.shields) {
          nextDamagedUpgrades.shields = true;
          nextLog = [`RADIATION HAZARD: SHIELDS systems damaged!`, ...nextLog].slice(0, 10);
          setTimeout(() => callbacks.onDiscovery({
            title: "RADIATION HAZARD",
            message: "Intense cosmic radiation has compromised your shield emitters! Defense dice are limited to 1 until repaired at a Trade Hub.",
            isHazard: true
          }), 0);
        }
      }

      // Check for encounter chance on move - NO encounters in Trade Hubs or Asteroid Belts
      let encounterChance = (sector.type === 'Trade Hub' || sector.type === 'Asteroid Belt') ? 0 : 0.05;

      if (encounterChance > 0 && Math.random() < encounterChance) {
        setTimeout(() => callbacks.onTriggerEncounter(sector.type === 'Ruin Sector'), 0);
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
          damagedUpgrades: nextDamagedUpgrades
        };
      }

      // Random item discovery (Rotational Rarity)
      const itemIndex = nextMoveCount % SPACE_JUNK.length;
      const candidateItem = SPACE_JUNK[itemIndex];

      const baseOdds = candidateItem.value / 2;

      let sectorMultiplier = 1;
      if (sector.type === 'Ship Graveyard') sectorMultiplier = 4;
      if (sector.type === 'Ruin Sector') sectorMultiplier = 2;
      if (sector.type === 'Trade Hub' || sector.type === 'Asteroid Belt') sectorMultiplier = 0;

      const successThreshold = sectorMultiplier;

      const foundItem = (Math.random() * baseOdds < successThreshold) ? candidateItem : null;

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

  return { moveGlobal };
}
