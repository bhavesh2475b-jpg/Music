import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface VisualizerProps {
  className?: string;
  count?: number;
  isPlaying?: boolean;
}

export const Visualizer: React.FC<VisualizerProps> = ({ 
  className, 
  count = 4,
  isPlaying = true
}) => {
  return (
    <div className={cn("flex items-end gap-0.5 h-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          animate={isPlaying ? {
            height: ["20%", "100%", "40%", "80%", "20%"],
          } : { height: "20%" }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut"
          }}
          className="w-1 bg-[#D0BCFF] rounded-full"
        />
      ))}
    </div>
  );
};
