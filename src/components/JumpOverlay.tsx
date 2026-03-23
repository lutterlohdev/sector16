import { motion } from 'motion/react';

interface JumpOverlayProps {
  isJumping: boolean;
  jumpProgress: number;
}

export default function JumpOverlay({ isJumping, jumpProgress }: JumpOverlayProps) {
  if (!isJumping) return null;

  return (
    <motion.div
      key="jump-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden"
    >
      <div className="starfield absolute inset-0 opacity-50" />
      <motion.div
        animate={{
          y: [0, -10, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{ repeat: Infinity, duration: 0.5 }}
        className="ship-pixel relative z-10 pixel-border"
      />
      <div className="mt-8 pixel-border p-4 bg-black relative z-10 w-64">
        <p className="text-xs mb-2 text-center tracking-widest">JUMPING...</p>
        <div className="h-2 w-full border border-white relative overflow-hidden">
          <motion.div
            className="h-full bg-white"
            initial={{ width: 0 }}
            animate={{ width: `${jumpProgress * 100}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}
