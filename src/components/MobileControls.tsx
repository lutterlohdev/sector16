import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { useRef, useCallback, useEffect } from 'react';

interface MobileControlsProps {
  moveGlobal: (dx: number, dy: number) => void;
  disabled?: boolean;
}

export default function MobileControls({ moveGlobal, disabled }: MobileControlsProps) {
  const intervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const startMoving = useCallback((dx: number, dy: number) => {
    if (disabled) return;
    moveGlobal(dx, dy);
    
    // Initial delay before auto-repeating
    timeoutRef.current = window.setTimeout(() => {
      intervalRef.current = window.setInterval(() => {
        moveGlobal(dx, dy);
      }, 150); // Speed of continuous movement
    }, 300); // Wait 300ms before repeating
  }, [moveGlobal, disabled]);

  const stopMoving = useCallback(() => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    timeoutRef.current = null;
    intervalRef.current = null;
  }, []);

  useEffect(() => {
    return () => stopMoving();
  }, [stopMoving]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const createButtonProps = (dx: number, dy: number) => ({
    onPointerDown: (e: React.PointerEvent) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      startMoving(dx, dy);
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.currentTarget.releasePointerCapture(e.pointerId);
      stopMoving();
    },
    onPointerCancel: stopMoving,
    onContextMenu: handleContextMenu,
    disabled,
    className: "w-10 h-10 flex items-center justify-center border border-white/30 hover:bg-white/20 active:bg-white/40 focus:outline-none disabled:opacity-30 disabled:cursor-not-allowed select-none touch-none",
  });

  return (
    <div className="md:hidden absolute bottom-4 left-4 z-50">
      <div className="grid grid-cols-3 gap-1 pixel-border bg-black/80 p-2">
        <div />
        <button {...createButtonProps(0, -1)}>
          <ArrowUp size={24} />
        </button>
        <div />
        <button {...createButtonProps(-1, 0)}>
          <ArrowLeft size={24} />
        </button>
        <button {...createButtonProps(0, 1)}>
          <ArrowDown size={24} />
        </button>
        <button {...createButtonProps(1, 0)}>
          <ArrowRight size={24} />
        </button>
      </div>
    </div>
  );
}

