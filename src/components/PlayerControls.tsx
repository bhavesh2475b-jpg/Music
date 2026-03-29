import React from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Repeat, 
  Shuffle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface PlayerControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  isShuffle: boolean;
  onToggleShuffle: () => void;
  repeatMode: 'none' | 'all' | 'one';
  onToggleRepeat: () => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  isPlaying,
  onTogglePlay,
  onNext,
  onPrevious,
  isShuffle,
  onToggleShuffle,
  repeatMode,
  onToggleRepeat,
  disabled = false,
  className,
  size = 'md'
}) => {
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8'
  };

  const playButtonSizes = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20'
  };

  const playIconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-10 h-10'
  };

  return (
    <div className={cn("flex items-center justify-center space-x-4 md:space-x-6", className)}>
      <button 
        onClick={onToggleShuffle}
        disabled={disabled}
        className={cn(
          "transition-colors p-2 rounded-xl hover:bg-white/5",
          isShuffle ? "text-[#D0BCFF]" : "text-[#CAC4D0] hover:text-[#E6E0E9]",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Shuffle className={iconSizes[size]} />
      </button>

      <button 
        onClick={onPrevious}
        disabled={disabled}
        className={cn(
          "text-[#E6E0E9] hover:text-[#D0BCFF] transition-colors p-2 hover:bg-white/5 rounded-xl",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <SkipBack className={cn(iconSizes[size], "fill-current")} />
      </button>

      <motion.button 
        whileHover={disabled ? {} : { scale: 1.05 }}
        whileTap={disabled ? {} : { scale: 0.95 }}
        onClick={onTogglePlay}
        disabled={disabled}
        className={cn(
          "bg-[#D0BCFF] text-[#381E72] rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl hover:bg-[#E8DEF8] transition-all",
          playButtonSizes[size],
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <AnimatePresence mode="wait">
          {isPlaying ? (
            <motion.div 
              key="pause" 
              initial={{ opacity: 0, scale: 0.5 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.5 }} 
              transition={{ duration: 0.15 }}
            >
              <Pause className={cn(playIconSizes[size], "fill-current")} />
            </motion.div>
          ) : (
            <motion.div 
              key="play" 
              initial={{ opacity: 0, scale: 0.5 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.5 }} 
              transition={{ duration: 0.15 }}
            >
              <Play className={cn(playIconSizes[size], "fill-current ml-1")} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      <button 
        onClick={onNext}
        disabled={disabled}
        className={cn(
          "text-[#E6E0E9] hover:text-[#D0BCFF] transition-colors p-2 hover:bg-white/5 rounded-xl",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <SkipForward className={cn(iconSizes[size], "fill-current")} />
      </button>

      <button 
        onClick={onToggleRepeat}
        disabled={disabled}
        className={cn(
          "transition-colors p-2 rounded-xl hover:bg-white/5 relative",
          repeatMode !== 'none' ? "text-[#D0BCFF]" : "text-[#CAC4D0] hover:text-[#E6E0E9]",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <Repeat className={iconSizes[size]} />
        {repeatMode === 'one' && (
          <span className="absolute top-0 right-0 text-[8px] font-bold bg-[#D0BCFF] text-[#381E72] w-3 h-3 rounded-full flex items-center justify-center">1</span>
        )}
      </button>
    </div>
  );
};
