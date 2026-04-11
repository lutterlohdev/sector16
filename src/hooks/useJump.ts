import { useState, Dispatch, SetStateAction } from 'react';
import { GameState } from '../types';

export function useJump(
  state: GameState | null,
  setState: Dispatch<SetStateAction<GameState | null>>,
  addLog: (msg: string) => void
) {
  const [isJumping, setIsJumping] = useState(false);
  const [jumpProgress, setJumpProgress] = useState(0);

  const completeJump = (index: number) => {
    if (!state) return;

    setIsJumping(false);
    const newSector = state.map[index];

    const disableJumpDrive = newSector.type === 'Nebula' && !state.jumpDriveDisabled && Math.random() < 0.2;

    const sectorRow = Math.floor(index / 4);
    const sectorCol = index % 4;
    const newCoords = { x: sectorCol * 16 + 8, y: sectorRow * 16 + 8 };

    setState(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        globalCoords: newCoords,
        lastDirection: 'up' as const,
        jumpDriveDisabled: disableJumpDrive ? true : prev.jumpDriveDisabled
      };
    });

    if (disableJumpDrive) {
      addLog(`WARNING: Nebula radiation has disabled your jump drive! Repair required at the Upgrade Center (64 CR).`);
    }

  };

  const jumpTo = (index: number) => {
    if (!state || isJumping) return;
    if (state.jumpDriveDisabled) {
      addLog("Jump drive offline. Repair required at the Upgrade Center.");
      return;
    }
    const currentSectorIndex = Math.floor(state.globalCoords.y / 16) * 4 + Math.floor(state.globalCoords.x / 16);
    if (index === currentSectorIndex) return;

    const from = state.map[currentSectorIndex].coords;
    const to = state.map[index].coords;
    const dist = Math.abs(from.r - to.r) + Math.abs(from.c - to.c);
    const duration = Math.min(dist * 2000, 8000);

    setIsJumping(true);
    setJumpProgress(0);

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setJumpProgress(progress);
      if (progress >= 1) {
        clearInterval(interval);
        completeJump(index);
      }
    }, 50);
  };

  return { isJumping, jumpProgress, jumpTo };
}
