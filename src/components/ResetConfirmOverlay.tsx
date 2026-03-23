import { motion } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

interface ResetConfirmOverlayProps {
  show: boolean;
  onCancel: () => void;
  onReset: () => void;
}

export default function ResetConfirmOverlay({ show, onCancel, onReset }: ResetConfirmOverlayProps) {
  if (!show) return null;

  return (
    <motion.div
      key="reset-confirm-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
    >
      <div className="pixel-border bg-black p-6 max-w-xs w-full text-center">
        <AlertTriangle className="mx-auto mb-4 text-red-500" size={32} />
        <h2 className="text-sm font-bold tracking-widest mb-2">WIPE ALL DATA?</h2>
        <p className="text-[10px] opacity-70 mb-6 leading-relaxed">
          THIS WILL PERMANENTLY DELETE YOUR SAVE FILE AND RESET ALL PROGRESS.
        </p>
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 pixel-button text-[10px] py-2"
          >
            CANCEL
          </button>
          <button
            onClick={onReset}
            className="flex-1 pixel-button text-[10px] py-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
          >
            RESET
          </button>
        </div>
      </div>
    </motion.div>
  );
}
