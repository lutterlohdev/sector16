import { useState, useEffect, useMemo, useCallback } from 'react';
import { GameState } from '../types';
import { STORAGE_KEY, INITIAL_STATE, generateMap, initializeWorldCoords } from '../utils/mapGenerator';

export function useGameState() {
  const [state, setState] = useState<GameState | null>(null);

  // Load game
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        let nextState = {
          ...INITIAL_STATE,
          ...parsed,

        };

        if (!nextState.map || nextState.map.length === 0) {
          nextState.map = generateMap();
        }

        nextState = initializeWorldCoords(nextState);
        setState(nextState);
      } catch (e) {
        const nextState = initializeWorldCoords({ ...INITIAL_STATE, map: generateMap() });
        setState(nextState);
      }
    } else {
      const nextState = initializeWorldCoords({ ...INITIAL_STATE, map: generateMap() });
      setState(nextState);
    }
  }, []);

  // Save game
  useEffect(() => {
    if (state) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state]);

  const addLog = useCallback((msg: string) => {
    setState(prev => {
      if (!prev) return prev;
      return { ...prev, log: [msg, ...prev.log].slice(0, 10) };
    });
  }, []);

  const resetGame = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    let nextState: GameState = { ...INITIAL_STATE, map: generateMap(), log: ["System Reset. Welcome to Sector 16."] };
    nextState = initializeWorldCoords(nextState);
    setState(nextState);
  }, []);

  const currentSector = useMemo(() => {
    if (!state || !state.map || state.map.length === 0) return null;
    const sectorIndex = Math.floor(state.globalCoords.y / 16) * 4 + Math.floor(state.globalCoords.x / 16);
    return state.map[sectorIndex];
  }, [state?.globalCoords, state?.map]);

  const isAtStorageLocker = useMemo(() => {
    if (!state) return false;
    return state.globalCoords.x === state.storageLockerCoords.x &&
           state.globalCoords.y === state.storageLockerCoords.y;
  }, [state?.globalCoords, state?.storageLockerCoords]);

  const isAtUpgradeCenter = useMemo(() => {
    if (!state) return false;
    return state.globalCoords.x === state.upgradeCenterCoords.x &&
           state.globalCoords.y === state.upgradeCenterCoords.y;
  }, [state?.globalCoords, state?.upgradeCenterCoords]);

  const totalPower = useMemo(() => {
    if (!state) return 0;
    return state.power;
  }, [state]);

  return {
    state,
    setState,
    addLog,
    resetGame,
    currentSector,
    isAtStorageLocker,
    isAtUpgradeCenter,
    totalPower,
  };
}
