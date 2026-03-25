import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

export interface CutSegmentCardProps {
  title?: string;
  startSeconds: number;
  endSeconds: number;
  aiRationale?: string;
  aiSuggested?: boolean;
  userApproved?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onPlay?: () => void;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export const CutSegmentCard: React.FC<CutSegmentCardProps> = ({
  title,
  startSeconds,
  endSeconds,
  aiRationale,
  aiSuggested = true,
  userApproved = false,
  onApprove,
  onReject,
  onPlay,
}) => {
  return (
    <Card className="mb-3 hover:border-gray-600 transition-colors">
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="font-mono bg-gray-900 border border-gray-700">
              {formatTime(startSeconds)} - {formatTime(endSeconds)}
            </Badge>
            {aiSuggested && !userApproved && (
              <Badge variant="info">AI Suggested</Badge>
            )}
            {userApproved && (
              <Badge variant="success">Approved</Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onPlay} className="h-8 px-2 text-blue-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            Play
          </Button>
        </div>

        {title && (
          <h4 className="text-gray-50 font-medium">{title}</h4>
        )}

        {aiRationale && (
          <p className="text-sm text-gray-400 bg-gray-900/50 p-3 rounded-lg border border-gray-800">
            <span className="text-blue-400 font-medium mr-1">AI Rationale:</span>
            {aiRationale}
          </p>
        )}

        {aiSuggested && !userApproved && (
          <div className="flex gap-2 mt-1">
            <Button variant="primary" size="sm" onClick={onApprove} className="flex-1">
              Approve Cut
            </Button>
            <Button variant="secondary" size="sm" onClick={onReject} className="flex-1">
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
