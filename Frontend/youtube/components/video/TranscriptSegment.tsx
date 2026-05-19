import React from 'react';
import type { TranscriptSegment as TranscriptSegmentType } from '../../types';

export interface TranscriptSegmentProps {
  segment: TranscriptSegmentType;
  isActive?: boolean;
  onClick?: (time: number) => void;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const TranscriptSegment: React.FC<TranscriptSegmentProps> = ({
  segment,
  isActive = false,
  onClick,
}) => {
  return (
    <div 
      className={`group flex gap-4 p-3 rounded-md cursor-pointer transition-colors ${
        isActive 
          ? 'bg-[color:var(--color-info-bg)] border border-[color:var(--color-info-border)]' 
          : 'hover:bg-surface-secondary border border-transparent'
      }`}
      onClick={() => onClick?.(segment.start_seconds)}
    >
      <div className="shrink-0 w-16">
        <span className={`text-code px-1.5 py-0.5 rounded-sm ${
          isActive 
            ? 'text-primary-600 bg-[color:var(--color-info-200)]' 
            : 'text-[color:var(--color-text-tertiary)] group-hover:text-[color:var(--color-text-secondary)]'
        }`}>
          {formatTime(segment.start_seconds)}
        </span>
      </div>
      <p className={`text-body-sm m-0 ${
        isActive ? 'text-[color:var(--color-text-primary)] font-medium' : 'text-[color:var(--color-text-secondary)]'
      }`}>
        {segment.text}
      </p>
    </div>
  );
};
