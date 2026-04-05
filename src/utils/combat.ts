import { GameState, Item, EncounterState, VolleyOutcome } from '../types';
import { NPC_NAMES_PREFIX, NPC_NAMES_SUFFIX, SPACE_JUNK } from '../constants';

/** Calculate the base hit chance for an attacker vs a defender */
export const calcHitChance = (attackStat: number, defenseStat: number): number => {
  const atk = Math.max(attackStat, 0.5);
  const def = Math.max(defenseStat, 0.5);
  return Math.min(0.95, Math.max(0.15, atk / (atk + def)));
};

/** Calculate critical hit bonus chance (scales with power advantage) */
export const calcCritChance = (attackStat: number, defenseStat: number): number => {
  const advantage = attackStat - defenseStat;
  if (advantage <= 0) return 0.03; // 3% base crit
  return Math.min(0.20, 0.03 + advantage * 0.02); // +2% per point advantage, max 20%
};

/** Resolve a single volley given a hit chance */
export const resolveVolley = (hitChance: number, critChance: number): VolleyOutcome => {
  const roll = Math.random();
  if (roll < critChance) return 'critical';
  if (roll < hitChance) return 'hit';
  return 'miss';
};

export const generateNPC = (playerPower: number, playerDefense: number, isRuin: boolean): EncounterState => {
  const name = `${NPC_NAMES_PREFIX[Math.floor(Math.random() * NPC_NAMES_PREFIX.length)]} ${NPC_NAMES_SUFFIX[Math.floor(Math.random() * NPC_NAMES_SUFFIX.length)]}`;

  const pPower = playerPower || 1;
  const pDefense = playerDefense || 1;

  let npcPower: number;
  let npcDefense: number;

  if (isRuin) {
    const maxP = pPower + 5;
    const minP = pPower <= 5 ? Math.max(1, pPower - 1) : 1;
    npcPower = Math.floor(Math.random() * (maxP - minP + 1)) + minP;

    const maxD = pDefense + 5;
    const minD = pDefense <= 5 ? Math.max(1, pDefense - 1) : 1;
    npcDefense = Math.floor(Math.random() * (maxD - minD + 1)) + minD;
  } else {
    const maxP = pPower + 3;
    const minP = pPower <= 5 ? Math.max(1, pPower - 3) : 1;
    npcPower = Math.floor(Math.random() * (maxP - minP + 1)) + minP;

    const maxD = pDefense + 3;
    const minD = pDefense <= 5 ? Math.max(1, pDefense - 3) : 1;
    npcDefense = Math.floor(Math.random() * (maxD - minD + 1)) + minD;
  }

  // Apply Archetypes (20% Glass Cannon, 20% Tank, 60% Standard)
  const archetypeRoll = Math.random();
  if (archetypeRoll < 0.2) {
    npcPower = Math.ceil(npcPower * 1.5);
    npcDefense = Math.max(1, Math.floor(npcDefense * 0.5));
  } else if (archetypeRoll < 0.4) {
    npcPower = Math.max(1, Math.floor(npcPower * 0.5));
    npcDefense = Math.ceil(npcDefense * 1.5);
  }

  const baseCredits = (npcPower + npcDefense) * 8;
  const npcCredits = Math.floor(baseCredits * (0.7 + Math.random() * 0.6));

  const isAmbush = Math.random() < 0.4;

  return {
    name,
    power: npcPower,
    defense: npcDefense,
    credits: npcCredits,
    type: isRuin ? 'ruin' : 'pirate',
    isAmbush,
    status: isAmbush ? 'ambushed' : 'waiting',
    currentVolley: 0,
    npcShields: npcDefense,
    playerHitChance: 0,
    volleyLog: [],
    isPlayerAttacking: !isAmbush,
  };
};

export const triggerDeath = (prev: GameState): GameState => {
  const tradeHub = prev.map.find(s => s.type === 'Trade Hub');
  const hubCoords = tradeHub ? { x: tradeHub.coords.c * 16 + 8, y: tradeHub.coords.r * 16 + 8 } : { x: 40, y: 24 };

  const nextCredits = Math.floor(prev.credits * 0.1);
  const newCapacity = 8;

  let nextInventory = [...prev.inventory];
  let nextNocturnium = prev.nocturnium;

  while (nextInventory.length + nextNocturnium > newCapacity) {
    if (nextInventory.length > 0) {
      const index = Math.floor(Math.random() * nextInventory.length);
      nextInventory.splice(index, 1);
    } else if (nextNocturnium > 0) {
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

export const rollCombatLoot = (encounterType: 'pirate' | 'ruin'): Item | null => {
  if (Math.random() < (encounterType === 'ruin' ? 0.8 : 0.3)) {
    const candidate = SPACE_JUNK[Math.floor(Math.random() * SPACE_JUNK.length)];
    const baseOdds = candidate.value / 4;
    const successThreshold = 2;
    if (Math.random() * baseOdds < successThreshold) {
      return candidate;
    }
  }
  return null;
};
