/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { DiscoveryState } from './types';
import { useGameState } from './hooks/useGameState';
import { useMovement } from './hooks/useMovement';
import { useJump } from './hooks/useJump';
import { useEncounter } from './hooks/useEncounter';
import { useTrading } from './hooks/useTrading';
import ShipNameEntry from './components/ShipNameEntry';
import TopBar from './components/TopBar';
import BottomNav from './components/BottomNav';
import GameLog from './components/GameLog';
import JumpOverlay from './components/JumpOverlay';
import ResetConfirmOverlay from './components/ResetConfirmOverlay';
import MapView from './components/MapView';
import SectorPanel from './components/SectorPanel';
import InventoryModal from './components/modals/InventoryModal';
import StorageModal from './components/modals/StorageModal';
import UpgradeCenterModal from './components/modals/UpgradeCenterModal';
import DiscoveryModal from './components/modals/DiscoveryModal';
import WizardModal from './components/modals/WizardModal';
import EncounterModal from './components/modals/EncounterModal';

export default function App() {
  // Core game state
  const {
    state, setState, addLog, resetGame,
    currentSector, isAtStorageLocker, isAtUpgradeCenter, totalPower
  } = useGameState();

  // UI state
  const [showInventory, setShowInventory] = useState(false);
  const [showStorage, setShowStorage] = useState(false);
  const [showUpgradeCenter, setShowUpgradeCenter] = useState(false);
  const [wizardEncounter, setWizardEncounter] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [discovery, setDiscovery] = useState<DiscoveryState | null>(null);

  // Encounter hook
  const {
    encounter, setEncounter, totalDefense,
    triggerEncounter, handleEncounterAction, useDuctTape
  } = useEncounter(state, setState, addLog);

  // Movement hook
  const { moveGlobal } = useMovement(setState, {
    onDiscovery: (d: DiscoveryState) => setDiscovery(d),
    onTriggerEncounter: (isRuin: boolean) => triggerEncounter(isRuin),
    onWizardEncounter: () => setWizardEncounter(true),
  });

  // Jump hook
  const { isJumping, jumpProgress, jumpTo } = useJump(state, setState, addLog, triggerEncounter);

  // Trading hook
  const {
    sellAll, sellItem, sellNocturnium,
    buyUpgrade, repairUpgrade, buyDuctTape
  } = useTrading(state, setState, addLog);

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
  }, [state, isJumping, encounter, showInventory, discovery, showResetConfirm, showUpgradeCenter, moveGlobal]);

  if (!state) return <div className="flex items-center justify-center h-screen bg-black text-white font-mono">LOADING...</div>;

  if (state.shipName === '') {
    return <ShipNameEntry state={state} setState={setState} />;
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white font-mono overflow-hidden crt">
      <TopBar
        shipName={state.shipName}
        credits={state.credits}
        inventoryCount={state.inventory.length}
        nocturnium={state.nocturnium}
        cargoCapacity={state.cargoCapacity}
        onResetClick={() => setShowResetConfirm(true)}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        <AnimatePresence>
          {isJumping && <JumpOverlay isJumping={isJumping} jumpProgress={jumpProgress} />}
        </AnimatePresence>

        <AnimatePresence>
          {showResetConfirm && (
            <ResetConfirmOverlay
              show={showResetConfirm}
              onCancel={() => setShowResetConfirm(false)}
              onReset={() => { resetGame(); setShowResetConfirm(false); }}
            />
          )}
        </AnimatePresence>

        <MapView
          state={state}
          currentSector={currentSector}
          onJumpTo={jumpTo}
          isJumping={isJumping}
        />

        {/* Right Panel: Sector Details & Actions */}
        <div className="w-1/2 flex flex-col bg-black">
          {currentSector && (
            <SectorPanel
              state={state}
              currentSector={currentSector}
              isAtStorageLocker={isAtStorageLocker}
              isAtUpgradeCenter={isAtUpgradeCenter}
              onShowStorage={() => setShowStorage(true)}
              onShowUpgradeCenter={() => setShowUpgradeCenter(true)}
              sellNocturnium={sellNocturnium}
              sellItem={sellItem}
              sellAll={sellAll}
              buyUpgrade={buyUpgrade}
              repairUpgrade={repairUpgrade}
              buyDuctTape={buyDuctTape}
            />
          )}

          <GameLog log={state.log} />
        </div>
      </div>

      <BottomNav
        totalPower={totalPower}
        totalDefense={totalDefense}
        hasCloakingSpell={state.hasCloakingSpell}
        onCargoClick={() => setShowInventory(true)}
        encounterActive={!!encounter}
      />

      {/* Modals */}
      <AnimatePresence>
        {showInventory && (
          <InventoryModal
            state={state}
            setState={setState}
            onClose={() => setShowInventory(false)}
          />
        )}

        {showStorage && (
          <StorageModal
            state={state}
            setState={setState}
            onClose={() => setShowStorage(false)}
          />
        )}

        {showUpgradeCenter && (
          <UpgradeCenterModal
            state={state}
            setState={setState}
            onClose={() => setShowUpgradeCenter(false)}
          />
        )}

        {discovery && (
          <DiscoveryModal
            state={state}
            setState={setState}
            discovery={discovery}
            addLog={addLog}
            onClose={() => setDiscovery(null)}
            onShowInventory={() => setShowInventory(true)}
          />
        )}

        {wizardEncounter && (
          <WizardModal
            state={state}
            setState={setState}
            addLog={addLog}
            onClose={() => setWizardEncounter(false)}
          />
        )}

        {encounter && (
          <EncounterModal
            state={state}
            encounter={encounter}
            totalPower={totalPower}
            totalDefense={totalDefense}
            onAction={handleEncounterAction}
            onUseDuctTape={useDuctTape}
            onClose={() => setEncounter(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
