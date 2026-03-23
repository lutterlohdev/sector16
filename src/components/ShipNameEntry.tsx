import { GameState } from '../types';
import { Dispatch, SetStateAction } from 'react';

interface ShipNameEntryProps {
  state: GameState;
  setState: Dispatch<SetStateAction<GameState | null>>;
}

export default function ShipNameEntry({ state, setState }: ShipNameEntryProps) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white font-mono p-8 crt">
      <h1 className="text-4xl mb-8 tracking-widest flicker">SECTOR 16</h1>
      <div className="pixel-border p-8 w-full max-w-md bg-black">
        <p className="mb-4">IDENTIFY YOUR VESSEL:</p>
        <input
          type="text"
          className="w-full bg-black border-2 border-white p-2 mb-4 outline-none focus:bg-white focus:text-black"
          placeholder="SHIP NAME..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const name = (e.target as HTMLInputElement).value.trim();
              if (name) setState({ ...state, shipName: name });
            }
          }}
        />
        <p className="text-xs opacity-50">PRESS ENTER TO INITIALIZE</p>
      </div>
    </div>
  );
}
