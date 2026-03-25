import React from 'react';

export interface TranscriptSegmentProps {
  startSeconds: number;
  endSeconds: number;
  text: string;
  isActive?: boolean;
  onClick?: (time: number) => void;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const TranscriptSegment: React.FC<TranscriptSegmentProps> = ({
  startSeconds,
  endSeconds,
  text,
  isActive = false,
  onClick,
}) => {
  return (
    <div 
      className={`group flex gap-4 p-3 rounded-lg cursor-pointer transition-colors ${
        isActive 
          ? 'bg-blue-500/10 border border-blue-500/30' 
          : 'hover:bg-gray-800 border border-transparent'
      }`}
      onClick={() => onClick?.(startSeconds)}
    >
      <div className="shrink-0 w-16">
        <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
          isActive ? 'text-blue-400 bg-blue-500/20' : 'text-gray-500 group-hover:text-gray-300'
        }`}>
          {formatTime(startSeconds)}
        </span>
      </div>
      <p className={`text-sm leading-relaxed ${
        isActive ? 'text-gray-50' : 'text-gray-300'
      }`}>
        {text}
      </p>
    </div>
  );
};
