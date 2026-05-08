import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

interface MobileControlsProps {
  moveGlobal: (dx: number, dy: number) => void;
  disabled?: boolean;
}

export default function MobileControls({ moveGlobal, disabled }: MobileControlsProps) {
  return (
    <div className="md:hidden absolute bottom-4 left-4 z-50">
      <div className="grid grid-cols-3 gap-1 pixel-border bg-black/80 p-2">
        <div />
        <button
          onClick={() => moveGlobal(0, -1)}
          disabled={disabled}
          className="w-10 h-10 flex items-center justify-center border border-white/30 hover:bg-white/20 active:bg-white/40 focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowUp size={24} />
        </button>
        <div />
        <button
          onClick={() => moveGlobal(-1, 0)}
          disabled={disabled}
          className="w-10 h-10 flex items-center justify-center border border-white/30 hover:bg-white/20 active:bg-white/40 focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowLeft size={24} />
        </button>
        <button
          onClick={() => moveGlobal(0, 1)}
          disabled={disabled}
          className="w-10 h-10 flex items-center justify-center border border-white/30 hover:bg-white/20 active:bg-white/40 focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowDown size={24} />
        </button>
        <button
          onClick={() => moveGlobal(1, 0)}
          disabled={disabled}
          className="w-10 h-10 flex items-center justify-center border border-white/30 hover:bg-white/20 active:bg-white/40 focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowRight size={24} />
        </button>
      </div>
    </div>
  );
}
