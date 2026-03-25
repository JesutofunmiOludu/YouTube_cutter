import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { VideoStatusBadge, VideoProcessingStatus } from './VideoStatusBadge';

export interface VideoCardProps {
  title: string;
  thumbnailUrl?: string;
  duration?: number;
  channelName: string;
  status: VideoProcessingStatus;
  onClick?: () => void;
}

const formatDuration = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const VideoCard: React.FC<VideoCardProps> = ({
  title,
  thumbnailUrl,
  duration,
  channelName,
  status,
  onClick,
}) => {
  return (
    <Card 
      className="group cursor-pointer hover:border-gray-600 transition-colors flex flex-col"
      onClick={onClick}
    >
      <div className="relative w-full aspect-video bg-gray-900 border-b border-gray-700 overflow-hidden">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600 font-medium">
            No Thumbnail
          </div>
        )}
        
        {duration !== undefined && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-gray-50 text-xs px-2 py-0.5 rounded font-mono">
            {formatDuration(duration)}
          </div>
        )}
      </div>

      <CardContent className="p-4 flex flex-col flex-1">
        <h3 className="text-sm font-medium text-gray-50 line-clamp-2 leading-tight mb-2 flex-1 group-hover:text-blue-400 transition-colors">
          {title}
        </h3>
        
        <div className="flex items-center justify-between mt-auto pt-2">
          <p className="text-xs text-gray-400 truncate pr-2">
            {channelName}
          </p>
          <VideoStatusBadge status={status} />
        </div>
      </CardContent>
    </Card>
  );
};
