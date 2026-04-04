import { useState, Dispatch, SetStateAction } from 'react';
import { GameState, EncounterState } from '../types';
import { generateNPC, rollDice, triggerDeath, rollCombatLoot } from '../utils/combat';

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

  const handleEncounterAction = (action: 'attack' | 'defend' | 'avoid' | 'fly') => {
    if (!state || !encounter) return;

    const totalPower = state.power;

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
        const foundItem = rollCombatLoot(encounter.type);
        const noctLoot = Math.floor(Math.random() * 9); // 0 to 8

        setState(s => {
          if (!s) return s;

          let nextInventory = [...s.inventory];
          let nextNocturnium = s.nocturnium;

          // Try to add item
          if (foundItem && (nextInventory.length + nextNocturnium) < s.cargoCapacity) {
            nextInventory.push(foundItem);
          }

          // Try to add nocturnium
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

  return {
    encounter,
    setEncounter,
    totalDefense,
    triggerEncounter,
    handleEncounterAction,
    useDuctTape,
  };
}
