import React from 'react';
import { cn } from '../lib/utils';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div 
      className={cn(
        "animate-pulse bg-white/5 rounded-xl",
        className
      )} 
    />
  );
};

export const TrackSkeleton: React.FC = () => {
  return (
    <div className="bg-[#2B2930] p-4 rounded-[2rem] border border-white/5 shadow-md shrink-0 w-48">
      <Skeleton className="aspect-square rounded-2xl mb-4" />
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
};

export const PlaylistSkeleton: React.FC = () => {
  return (
    <div className="bg-[#2B2930] p-5 rounded-[2rem] border border-white/5 shadow-md">
      <Skeleton className="aspect-square rounded-2xl mb-5" />
      <Skeleton className="h-6 w-2/3 mb-2" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  );
};
