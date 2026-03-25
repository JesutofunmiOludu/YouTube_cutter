import React from 'react';
import { Badge } from '../ui/Badge';

export type VideoProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface VideoStatusBadgeProps {
  status: VideoProcessingStatus;
  className?: string;
}

export const VideoStatusBadge: React.FC<VideoStatusBadgeProps> = ({ status, className = '' }) => {
  switch (status) {
    case 'completed':
      return <Badge variant="success" className={className}>Ready</Badge>;
    case 'processing':
      return <Badge variant="info" className={className}>Processing</Badge>;
    case 'failed':
      return <Badge variant="danger" className={className}>Failed</Badge>;
    case 'pending':
    default:
      return <Badge variant="default" className={className}>Pending</Badge>;
  }
};
