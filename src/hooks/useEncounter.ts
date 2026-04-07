import { useState, useCallback, Dispatch, SetStateAction } from 'react';
import { GameState, EncounterState, VolleyOutcome } from '../types';
import { generateNPC, calcHitChance, calcCritChance, resolveVolley, triggerDeath, rollCombatLoot } from '../utils/combat';

const OVERCHARGE_BONUS = 0.15;
const CHARGE_DURATION_MS = 1200;

export function useEncounter(
  state: GameState | null,
  setState: Dispatch<SetStateAction<GameState | null>>,
  addLog: (msg: string) => void
) {
  const [encounter, setEncounter] = useState<EncounterState | null>(null);

  const totalDefense = (state?.defense || 0) + (encounter?.tempDefense || 0);

  const triggerEncounter = (isRuin: boolean) => {
    if (state && state.defense <= 0) return;
    const npc = generateNPC(state?.power || 1, state?.defense || 1, isRuin);

    // Pre-calculate the initial hit chance
    if (npc.isAmbush) {
      // NPC attacks first — hit chance shown is player's chance to deflect
      npc.playerHitChance = calcHitChance(state?.defense || 1, npc.power);
      npc.isPlayerAttacking = false;
    } else {
      npc.playerHitChance = calcHitChance(state?.power || 1, npc.defense);
      npc.isPlayerAttacking = true;
    }

    setEncounter(npc);
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

  /** Award loot and finish the encounter as a victory */
  const awardVictory = useCallback((enc: EncounterState) => {
    if (!state) return;

    const loot = enc.credits;
    const foundItem = rollCombatLoot(enc.type);
    const noctLoot = Math.floor(Math.random() * 9);

    setState(s => {
      if (!s) return s;

      const nextInventory = [...s.inventory];
      let nextNocturnium = s.nocturnium;

      if (foundItem && (nextInventory.length + nextNocturnium) < s.cargoCapacity) {
        nextInventory.push(foundItem);
      }

      for (let i = 0; i < noctLoot; i++) {
        if ((nextInventory.length + nextNocturnium) < s.cargoCapacity) {
          nextNocturnium++;
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

    const msg = `VICTORY! You destroyed ${enc.name} and looted ${loot} credits.${foundItem ? ` Salvaged: ${foundItem.name}` : ''}${noctLoot > 0 ? ` Found ${noctLoot} Nocturnium.` : ''}`;
    addLog(msg);
    setEncounter(prev => prev ? { ...prev, npcShields: 0, result: msg, status: 'finished' } : null);
  }, [state, setState, addLog]);

  /** Handle player death */
  const handlePlayerDeath = useCallback(() => {
    if (!state) return;
    const tradeHub = state.map.find(s => s.type === 'Trade Hub');
    const msg = `LOOTED! Your ship was disabled. You were towed to ${tradeHub?.name || 'Trade Hub'}. Stats reset. 90% credits lost.`;
    addLog(msg);
    setState(prev => prev ? triggerDeath(prev) : null);
    setEncounter(e => e ? { ...e, result: msg, status: 'finished' } : null);
  }, [state, setState, addLog]);

  /** Execute a single volley and resolve the outcome */
  const executeVolley = useCallback((enc: EncounterState, currentState: GameState, isPlayerAttacking: boolean, overcharged: boolean) => {
    const playerPower = currentState.power;
    const playerDef = currentState.defense + (enc.tempDefense || 0);
    const weaponsDamaged = currentState.damagedUpgrades.weapons;

    let hitChance: number;
    let critChance: number;

    if (isPlayerAttacking) {
      hitChance = calcHitChance(playerPower, enc.npcShields);
      critChance = calcCritChance(playerPower, enc.npcShields);
      if (weaponsDamaged) hitChance = Math.max(0.15, hitChance - 0.15);
      if (overcharged) hitChance = Math.min(0.95, hitChance + OVERCHARGE_BONUS);
    } else {
      hitChance = calcHitChance(playerDef, enc.power);
      critChance = calcCritChance(playerDef, enc.power);
      if (overcharged) hitChance = Math.min(0.95, hitChance + OVERCHARGE_BONUS);
    }

    const outcome: VolleyOutcome = resolveVolley(hitChance, critChance);
    const nextVolley = enc.currentVolley + 1;

    const record = {
      volley: nextVolley,
      outcome,
      hitChance,
      wasOvercharged: overcharged,
    };

    if (isPlayerAttacking) {
      if (outcome === 'critical') {
        const newShields = Math.max(0, enc.npcShields - 2);
        const msg = `CRITICAL HIT! Volley ${nextVolley}: Tore through their shields! (-2)`;
        addLog(msg);

        if (newShields <= 0) {
          setEncounter(prev => prev ? {
            ...prev,
            currentVolley: nextVolley,
            npcShields: 0,
            lastOutcome: outcome,
            volleyLog: [...prev.volleyLog, record],
            exchangeResult: msg,
            playerHitChance: hitChance,
          } : null);
          setTimeout(() => awardVictory(enc), 400);
          return;
        }

        setEncounter(prev => prev ? {
          ...prev,
          currentVolley: nextVolley,
          npcShields: newShields,
          lastOutcome: outcome,
          volleyLog: [...prev.volleyLog, record],
          status: 'between-volleys',
          exchangeResult: msg,
          playerHitChance: calcHitChance(playerPower, newShields),
          isPlayerAttacking: true,
          overcharged: false,
        } : null);

      } else if (outcome === 'hit') {
        const newShields = Math.max(0, enc.npcShields - 1);
        const msg = `HIT! Volley ${nextVolley}: Direct hit on their shields. (-1)`;
        addLog(msg);

        if (newShields <= 0) {
          setEncounter(prev => prev ? {
            ...prev,
            currentVolley: nextVolley,
            npcShields: 0,
            lastOutcome: outcome,
            volleyLog: [...prev.volleyLog, record],
            exchangeResult: msg,
            playerHitChance: hitChance,
          } : null);
          setTimeout(() => awardVictory(enc), 400);
          return;
        }

        setEncounter(prev => prev ? {
          ...prev,
          currentVolley: nextVolley,
          npcShields: newShields,
          lastOutcome: outcome,
          volleyLog: [...prev.volleyLog, record],
          status: 'between-volleys',
          exchangeResult: msg,
          playerHitChance: calcHitChance(playerPower, newShields),
          isPlayerAttacking: true,
          overcharged: false,
        } : null);

      } else {
        // Miss — NPC retaliates, player loses 1 shield
        const msg = `MISS! Volley ${nextVolley}: Shot went wide. They return fire! (-1 Shield)`;
        addLog(msg);

        const newDefense = currentState.defense - 1;
        if (newDefense <= 0) {
          handlePlayerDeath();
          return;
        }

        setState(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            defense: newDefense,
            upgrades: { ...prev.upgrades, shields: newDefense },
          };
        });

        // NPC might flee after volley 2+
        if (nextVolley >= 2 && Math.random() < 0.1) {
          const fleeMsg = `${enc.name} warped out after the exchange!`;
          addLog(fleeMsg);
          setEncounter(prev => prev ? {
            ...prev,
            currentVolley: nextVolley,
            lastOutcome: outcome,
            volleyLog: [...prev.volleyLog, record],
            result: fleeMsg,
            status: 'finished',
            exchangeResult: msg,
          } : null);
          return;
        }

        setEncounter(prev => prev ? {
          ...prev,
          currentVolley: nextVolley,
          lastOutcome: outcome,
          volleyLog: [...prev.volleyLog, record],
          status: 'between-volleys',
          exchangeResult: msg,
          playerHitChance: calcHitChance(playerPower, prev.npcShields),
          isPlayerAttacking: true,
          overcharged: false,
        } : null);
      }
    } else {
      // NPC attacking player (defend phase)
      if (outcome === 'critical') {
        const msg = `PERFECT DEFLECT! Volley ${nextVolley}: You turned their shot back on them!`;
        addLog(msg);

        const newNpcShields = Math.max(0, enc.npcShields - 1);

        if (newNpcShields <= 0) {
          setEncounter(prev => prev ? {
            ...prev,
            currentVolley: nextVolley,
            npcShields: 0,
            lastOutcome: outcome,
            volleyLog: [...prev.volleyLog, record],
            exchangeResult: msg,
            playerHitChance: hitChance,
          } : null);
          setTimeout(() => awardVictory(enc), 400);
          return;
        }

        setEncounter(prev => prev ? {
          ...prev,
          currentVolley: nextVolley,
          npcShields: newNpcShields,
          lastOutcome: outcome,
          volleyLog: [...prev.volleyLog, record],
          status: 'between-volleys',
          exchangeResult: msg,
          playerHitChance: calcHitChance(playerPower, newNpcShields),
          isPlayerAttacking: true,
          overcharged: false,
        } : null);

      } else if (outcome === 'hit') {
        const msg = `DEFLECTED! Volley ${nextVolley}: Shields held. You have the advantage!`;
        addLog(msg);

        setEncounter(prev => prev ? {
          ...prev,
          currentVolley: nextVolley,
          lastOutcome: outcome,
          volleyLog: [...prev.volleyLog, record],
          status: 'between-volleys',
          exchangeResult: msg,
          playerHitChance: calcHitChance(playerPower, prev.npcShields),
          isPlayerAttacking: true,
          overcharged: false,
        } : null);

      } else {
        // Player failed to defend — takes damage
        const msg = `BREACHED! Volley ${nextVolley}: Their shot punched through!`;
        addLog(msg);

        let realLoss = 1;
        let newTempDef = enc.tempDefense || 0;
        if (newTempDef > 0) {
          newTempDef -= 1;
          realLoss = 0;
        }

        const newDefense = currentState.defense - realLoss;
        if (newDefense <= 0 && realLoss > 0) {
          handlePlayerDeath();
          return;
        }

        if (realLoss > 0) {
          setState(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              defense: newDefense,
              upgrades: { ...prev.upgrades, shields: newDefense },
            };
          });
        }

        if (Math.random() < 0.5) {
          setEncounter(prev => prev ? {
            ...prev,
            currentVolley: nextVolley,
            lastOutcome: outcome,
            volleyLog: [...prev.volleyLog, record],
            status: 'between-volleys',
            exchangeResult: msg + " They're lining up another shot!",
            playerHitChance: calcHitChance(Math.max(1, playerDef - realLoss), enc.power),
            isPlayerAttacking: false,
            tempDefense: newTempDef,
            overcharged: false,
          } : null);
        } else {
          setEncounter(prev => prev ? {
            ...prev,
            currentVolley: nextVolley,
            lastOutcome: outcome,
            volleyLog: [...prev.volleyLog, record],
            status: 'between-volleys',
            exchangeResult: msg + " Opening in their formation — your turn!",
            playerHitChance: calcHitChance(playerPower, prev.npcShields),
            isPlayerAttacking: true,
            tempDefense: newTempDef,
            overcharged: false,
          } : null);
        }
      }
    }
  }, [addLog, setState, awardVictory, handlePlayerDeath]);

  const handleEncounterAction = (action: 'attack' | 'defend' | 'avoid' | 'fly' | 'overcharge' | 'disengage') => {
    if (!state || !encounter) return;

    if (action === 'fly') {
      addLog("You successfully flew away.");
      setEncounter(null);
      return;
    }

    if (action === 'avoid') {
      const chance = state.hasCloakingSpell ? 1.0 : (!encounter.isAmbush ? 1.0 : (encounter.type === 'ruin' ? 0.1 : 0.8));
      if (Math.random() < chance) {
        let avoidMsg: string;
        if (state.hasCloakingSpell) {
          avoidMsg = "Cloaking Spell active: Successfully avoided the encounter.";
        } else if (!encounter.isAmbush) {
          avoidMsg = "No threat detected — slipped away unnoticed.";
        } else {
          const pct = Math.round(chance * 100);
          avoidMsg = `Lucky escape! Beat a ${pct}% chance to avoid ${encounter.name}.`;
        }
        addLog(avoidMsg);
        setEncounter(null);
      } else {
        // Failed avoid — force into a defend volley immediately
        addLog("Avoid failed! Brace for impact!");

        const encSnapshot = { ...encounter };
        const stateSnapshot = { ...state };

        setEncounter(prev => prev ? {
          ...prev,
          status: 'charging',
          isPlayerAttacking: false,
          exchangeResult: "Evasion failed! Incoming fire!",
        } : null);

        setTimeout(() => {
          executeVolley(encSnapshot, stateSnapshot, false, false);
        }, CHARGE_DURATION_MS);
      }
      return;
    }

    if (action === 'disengage') {
      if (encounter.currentVolley < 1) return;
      addLog("You disengaged from the battle.");
      setEncounter(prev => prev ? {
        ...prev,
        result: "You pulled away and disengaged from the fight.",
        status: 'finished',
      } : null);
      return;
    }

    if (action === 'overcharge') {
      if (state.defense <= 1) {
        addLog("Shields too low to overcharge!");
        return;
      }

      setState(prev => {
        if (!prev) return prev;
        const nextDefense = prev.defense - 1;
        return {
          ...prev,
          defense: nextDefense,
          upgrades: { ...prev.upgrades, shields: nextDefense },
        };
      });

      setEncounter(prev => prev ? {
        ...prev,
        overcharged: true,
        exchangeResult: "OVERCHARGED! Diverted shield power to weapons. (+15% hit chance, -1 Shield)",
      } : null);

      addLog("Overcharged weapons! Shield energy diverted. (+15% hit, -1 Shield)");
      return;
    }

    if (action === 'attack' || action === 'defend') {
      const isPlayerAttacking = action === 'attack';

      // Snapshot current state for the volley resolution
      const encSnapshot = { ...encounter };
      const stateSnapshot = { ...state };

      // Start the charging phase
      setEncounter(prev => prev ? {
        ...prev,
        status: 'charging',
        isPlayerAttacking,
      } : null);

      // After the charge animation, resolve the volley
      setTimeout(() => {
        executeVolley(encSnapshot, stateSnapshot, isPlayerAttacking, encounter.overcharged || false);
      }, CHARGE_DURATION_MS);
      return;
    }
  };

  return {
    encounter,
    setEncounter,
    totalDefense,
    triggerEncounter,
    handleEncounterAction,
    useDuctTape,
  };
}
